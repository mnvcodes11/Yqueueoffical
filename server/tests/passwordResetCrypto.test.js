const assert = require('node:assert/strict');
const test = require('node:test');
const { generateOtp, generateResetToken, hashValue, hashesMatch } = require('../utils/passwordResetCrypto');

test('OTP is a six-digit cryptographically generated value', () => {
  const values = new Set(Array.from({ length: 100 }, generateOtp));

  assert.equal(values.size > 1, true);
  for (const value of values) assert.match(value, /^\d{6}$/);
});

test('OTP hashes verify without storing the plaintext value', () => {
  const otp = generateOtp();
  const hash = hashValue(otp);

  assert.notEqual(hash, otp);
  assert.equal(hashesMatch(hashValue(otp), hash), true);
  assert.equal(hashesMatch(hashValue('000000'), hash), false);
});

test('reset authorization tokens have sufficient random length and are not reusable as hashes', () => {
  const first = generateResetToken();
  const second = generateResetToken();

  assert.match(first, /^[a-f0-9]{64}$/);
  assert.match(second, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.equal(hashesMatch(hashValue(first), hashValue(second)), false);
});