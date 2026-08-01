const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const QR_SECRET = process.env.QR_SECRET || process.env.JWT_SECRET;
const QR_EXPIRES_IN = process.env.QR_EXPIRES_IN || '6h';

const signQrToken = (order, student, issuedAt = new Date()) => {
  const expiresAt = new Date(issuedAt.getTime() + 1000 * 60 * 15);
  const nonce = crypto.randomBytes(8).toString('hex');

  return jwt.sign(
    {
      orderId: order._id.toString(),
      studentId: student._id.toString(),
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      nonce,
      purpose: 'yqueue_order_pickup',
    },
    QR_SECRET,
    {
      expiresIn: QR_EXPIRES_IN,
    }
  );
};

const verifyQrToken = (token) => {
  const decoded = jwt.verify(token, QR_SECRET);
  if (decoded.purpose !== 'yqueue_order_pickup') {
    throw new Error('Invalid token purpose');
  }
  if (!decoded.orderId || !decoded.studentId || !decoded.issuedAt || !decoded.expiresAt || !decoded.nonce) {
    throw new Error('Invalid token payload');
  }
  return decoded;
};

module.exports = { signQrToken, verifyQrToken };
