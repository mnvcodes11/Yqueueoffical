const express = require('express');
const {
  signup,
  login,
  getMe,
  createWorker,
  getWorkers,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/authController');
const {
  signupValidation,
  loginValidation,
  createWorkerValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
} = require('../utils/validators');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  authLimiter,
  forgotPasswordLimiter,
  otpVerificationLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiter');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post('/signup', authLimiter, signupValidation, validateRequest, signup);
router.post('/login', authLimiter, loginValidation, validateRequest, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/verify-otp', otpVerificationLimiter, verifyOtpValidation, validateRequest, verifyOtp);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, validateRequest, resetPassword);
router.get('/me', protect, getMe);
router.post('/create-worker', protect, authorize('admin'), createWorkerValidation, validateRequest, createWorker);
router.get('/workers', protect, authorize('admin'), getWorkers);

module.exports = router;
