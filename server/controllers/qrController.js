const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { verifyQrToken } = require('../utils/qrToken');
const { emitOrderUpdateToStudent, emitOrderUpdateToStaff } = require('../socket');
const { buildQueueSnapshot } = require('../utils/queueService');

// @desc    Get the pickup QR token for one of the student's own paid orders
// @route   GET /api/qr/:orderId
// @access  Private/Student
const getQr = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).select('+qrToken');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  if (order.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  if (order.status !== 'ready' || !order.qrToken || order.qrUsed) {
    return res.status(400).json({ success: false, message: 'No active pickup QR for this order' });
  }

  res.status(200).json({ success: true, qrToken: order.qrToken, status: order.status });
});

// @desc    Worker scans a student's QR at the counter to verify + complete pickup
// @route   POST /api/qr/verify
// @access  Private/Worker,Admin
const verifyQr = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'QR token is required' });
  }

  let decoded;
  try {
    decoded = verifyQrToken(token);
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });
  }

  const order = await Order.findById(decoded.orderId).select('+qrToken');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.student.toString() !== decoded.studentId) {
    return res.status(403).json({ success: false, message: 'QR token does not match this order' });
  }

  const expiresAt = decoded.expiresAt ? new Date(decoded.expiresAt) : null;
  const isExpired = expiresAt ? new Date() > expiresAt : false;

  const isValid =
    order.qrToken === token &&
    order.payment.status === 'paid' &&
    order.status === 'ready' &&
    !order.qrUsed &&
    !isExpired;

  if (!isValid) {
    if (order.qrUsed) {
      return res.status(409).json({ success: false, message: 'QR already used', order });
    }
    if (order.status !== 'ready') {
      return res.status(400).json({ success: false, message: 'Order is not ready for pickup' });
    }
    if (order.payment.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment is still pending' });
    }
    if (isExpired) {
      return res.status(410).json({ success: false, message: 'QR expired' });
    }
    return res.status(400).json({ success: false, message: 'QR code is invalid' });
  }

  // Atomic guard: flip qrUsed only if the order is still ready and unused.
  // This prevents a stale scan from collecting an order that was already
  // claimed or that changed state after token validation.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, qrUsed: false, status: 'ready' },
    {
      $set: {
        qrUsed: true,
        status: 'collected',
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
        collectedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!claimed) {
    return res.status(400).json({ success: false, message: 'QR code was already used' });
  }

  const refreshedOrder = await Order.findById(claimed._id).populate('student', 'name email').populate('workerAssigned', 'name');
  const safeOrder = refreshedOrder.toObject();
  delete safeOrder.qrToken;
  safeOrder.queueSnapshot = buildQueueSnapshot(refreshedOrder, await Order.find({ status: { $in: ['paid', 'preparing', 'ready'] } }).sort({ queueNumber: 1, createdAt: 1 }));

  emitOrderUpdateToStudent(refreshedOrder.student, safeOrder);
  emitOrderUpdateToStaff(safeOrder);

  res.status(200).json({ success: true, message: 'Order verified and marked collected', order: safeOrder });
});

module.exports = { getQr, verifyQr };
