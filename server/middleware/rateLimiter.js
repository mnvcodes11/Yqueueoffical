const {
  authLimiter,
  apiLimiter,
  publicLimiter,
  forgotPasswordLimiter,
  otpVerificationLimiter,
  passwordResetLimiter,
} = require('./security');

module.exports = {
  authLimiter,
  apiLimiter,
  publicLimiter,
  forgotPasswordLimiter,
  otpVerificationLimiter,
  passwordResetLimiter,
};
