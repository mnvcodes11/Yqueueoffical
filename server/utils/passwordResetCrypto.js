const crypto = require('crypto');

const OTP_LENGTH = 6;

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const hashesMatch = (left, right) => {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const generateOtp = () => crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

module.exports = { hashValue, hashesMatch, generateOtp, generateResetToken };