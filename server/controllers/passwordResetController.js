const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendOtpEmail, sendPasswordResetSuccessEmail } = require('../utils/emailService');
const { logPasswordEvent } = require('../utils/auditLogger');

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESET_SESSION_TTL_MS = 15 * 60 * 1000;

const safeResponse = (res) =>
  res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });

const hashValue = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

const generateOtp = () => {
  const otp = crypto.randomInt(0, 999999).toString().padStart(OTP_LENGTH, '0');
  return otp;
};

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    await logPasswordEvent({ email: normalizedEmail, event: 'forgot_password_request', ip: req.ip });
    return safeResponse(res);
  }

  const otp = generateOtp();
  const otpHash = hashValue(otp);
  const expiry = new Date(Date.now() + OTP_TTL_MS);

  user.otpHash = otpHash;
  user.otpExpiry = expiry;
  user.otpAttempts = 0;
  user.otpCreatedAt = new Date();
  user.resetSessionHash = undefined;
  user.resetSessionExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpEmail(user, otp);
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'otp_generated', ip: req.ip });
  } catch (error) {
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'otp_email_failed', ip: req.ip });
  }

  return safeResponse(res);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+otpHash +otpExpiry +otpAttempts +resetSessionHash +resetSessionExpiry');

  if (!user || !user.otpHash || !user.otpExpiry) {
    await logPasswordEvent({ email: normalizedEmail, event: 'otp_failed', ip: req.ip });
    return res.status(400).json({ success: false, message: 'Invalid code or code expired' });
  }

  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'too_many_otp_attempts', ip: req.ip });
    return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new code.' });
  }

  if (new Date() > new Date(user.otpExpiry)) {
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpCreatedAt = undefined;
    await user.save({ validateBeforeSave: false });
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'otp_expired', ip: req.ip });
    return res.status(400).json({ success: false, message: 'Invalid code or code expired' });
  }

  const submittedHash = hashValue(String(otp).trim());
  if (!crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(user.otpHash))) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'otp_failed', ip: req.ip });
    return res.status(400).json({ success: false, message: 'Invalid code or code expired' });
  }

  const sessionValue = crypto.randomBytes(32).toString('hex');
  const sessionHash = hashValue(sessionValue);
  const sessionExpiry = new Date(Date.now() + RESET_SESSION_TTL_MS);

  user.resetSessionHash = sessionHash;
  user.resetSessionExpiry = sessionExpiry;
  user.otpHash = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
  user.otpCreatedAt = undefined;
  await user.save({ validateBeforeSave: false });

  await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'otp_verified', ip: req.ip });

  res.status(200).json({ success: true, message: 'OTP verified', resetToken: sessionValue });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, password } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+resetSessionHash +resetSessionExpiry +password');

  if (!user || !user.resetSessionHash || !user.resetSessionExpiry) {
    await logPasswordEvent({ email: normalizedEmail, event: 'reset_failed', ip: req.ip });
    return res.status(400).json({ success: false, message: 'Invalid or expired reset session' });
  }

  if (new Date() > new Date(user.resetSessionExpiry)) {
    user.resetSessionHash = undefined;
    user.resetSessionExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'reset_session_expired', ip: req.ip });
    return res.status(400).json({ success: false, message: 'Invalid or expired reset session' });
  }

  const submittedHash = hashValue(String(resetToken).trim());
  if (!crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(user.resetSessionHash))) {
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'reset_failed', ip: req.ip });
    return res.status(400).json({ success: false, message: 'Invalid or expired reset session' });
  }

  user.password = password;
  user.resetSessionHash = undefined;
  user.resetSessionExpiry = undefined;
  await user.save();

  await sendPasswordResetSuccessEmail(user);
  await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'password_changed', ip: req.ip });

  res.status(200).json({ success: true, message: 'Password reset complete. Please log in with your new password.' });
});

module.exports = { forgotPassword, verifyOtp, resetPassword };
