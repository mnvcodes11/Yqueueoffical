const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendOtpEmail, sendPasswordResetSuccessEmail, safeSmtpErrorDetails } = require('../utils/emailService');
const { logPasswordEvent } = require('../utils/auditLogger');
const { hashValue, hashesMatch, generateOtp, generateResetToken } = require('../utils/passwordResetCrypto');

const OTP_LENGTH = 6;
const OTP_TTL_MS = Number(process.env.OTP_TTL_MINUTES || 10) * 60 * 1000;
const MAX_OTP_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_COOLDOWN_MS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60) * 1000;
const OTP_REQUEST_WINDOW_MS = Number(process.env.OTP_REQUEST_WINDOW_MINUTES || 15) * 60 * 1000;
const MAX_OTP_REQUESTS_PER_WINDOW = Number(process.env.OTP_MAX_REQUESTS_PER_WINDOW || 3);
const RESET_SESSION_TTL_MS = Number(process.env.RESET_SESSION_TTL_MINUTES || 15) * 60 * 1000;

const safeResponse = (res) =>
  res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+otpLastSentAt +otpRequestCount +otpRequestWindowStart'
  );

  if (!user) {
    await logPasswordEvent({ email: normalizedEmail, event: 'forgot_password_request', ip: req.ip });
    return safeResponse(res);
  }

  const now = Date.now();
  const lastSentAt = user.otpLastSentAt ? new Date(user.otpLastSentAt).getTime() : 0;
  if (lastSentAt && now - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
    return safeResponse(res);
  }

  const windowStart = user.otpRequestWindowStart ? new Date(user.otpRequestWindowStart).getTime() : 0;
  const requestCount = windowStart && now - windowStart < OTP_REQUEST_WINDOW_MS ? user.otpRequestCount : 0;
  if (requestCount >= MAX_OTP_REQUESTS_PER_WINDOW) {
    return safeResponse(res);
  }

  const otp = generateOtp();
  const otpHash = hashValue(otp);
  const expiry = new Date(Date.now() + OTP_TTL_MS);

  user.otpHash = otpHash;
  user.otpExpiry = expiry;
  user.otpAttempts = 0;
  user.otpCreatedAt = new Date();
  user.otpLastSentAt = new Date(now);
  user.otpRequestWindowStart = requestCount ? new Date(windowStart) : new Date(now);
  user.otpRequestCount = requestCount + 1;
  user.resetSessionHash = undefined;
  user.resetSessionExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpEmail(user, otp);
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'otp_generated', ip: req.ip });
  } catch (error) {
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpCreatedAt = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('[SMTP-DIAGNOSTIC] OTP delivery failed', safeSmtpErrorDetails(error));
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
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpCreatedAt = undefined;
    await user.save({ validateBeforeSave: false });
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
  if (!hashesMatch(submittedHash, user.otpHash)) {
    user.otpAttempts += 1;
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpHash = undefined;
      user.otpExpiry = undefined;
      user.otpAttempts = 0;
      user.otpCreatedAt = undefined;
    }
    await user.save({ validateBeforeSave: false });
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'otp_failed', ip: req.ip });
    return res.status(user.otpHash ? 400 : 429).json({
      success: false,
      message: user.otpHash ? 'Invalid code or code expired' : 'Too many attempts. Please request a new code.',
    });
  }

  const sessionValue = generateResetToken();
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
  if (!hashesMatch(submittedHash, user.resetSessionHash)) {
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'reset_failed', ip: req.ip });
    return res.status(400).json({ success: false, message: 'Invalid or expired reset session' });
  }

  user.password = password;
  user.resetSessionHash = undefined;
  user.resetSessionExpiry = undefined;
  await user.save();

  try {
    await sendPasswordResetSuccessEmail(user);
  } catch (error) {
    await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'reset_confirmation_email_failed', ip: req.ip });
  }
  await logPasswordEvent({ userId: user._id, email: normalizedEmail, event: 'password_changed', ip: req.ip });

  res.status(200).json({ success: true, message: 'Password reset complete. Please log in with your new password.' });
});

module.exports = { forgotPassword, verifyOtp, resetPassword };
