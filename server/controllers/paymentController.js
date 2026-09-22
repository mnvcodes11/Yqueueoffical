const crypto = require('crypto');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const razorpay = require('../utils/razorpay');
const { signQrToken } = require('../utils/qrToken');
const { rollbackStock } = require('./orderController');
const { emitOrderUpdateToStudent, emitOrderUpdateToStaff } = require('../socket');
const { buildQueueSnapshot } = require('../utils/queueService');

// Razorpay amounts are in the smallest currency unit (paise for INR).
const toPaise = (rupees) => Math.round(rupees * 100);

const nextQueueNumber = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const countToday = await Order.countDocuments({
    createdAt: { $gte: startOfDay },
    status: { $in: ['paid', 'preparing', 'ready', 'collected'] },
  });

  return countToday + 1;
};

// @desc    Create a Razorpay order for an existing pending_payment YQueue order
// @route   POST /api/payment/create-order
// @access  Private/Student
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  if (order.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  if (order.status !== 'pending_payment') {
    return res.status(400).json({ success: false, message: `Order is already ${order.status}` });
  }
  if (order.payment.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Order already paid' });
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: toPaise(order.totalPrice),
    currency: 'INR',
    receipt: order._id.toString(),
    notes: { yqueueOrderId: order._id.toString() },
  });

  order.payment.status = 'pending';
  order.payment.attemptCount = (order.payment.attemptCount || 0) + 1;
  order.payment.lastAttemptAt = new Date();
  order.payment.razorpayOrderId = razorpayOrder.id;
  order.payment.razorpayPaymentId = null;
  order.payment.razorpaySignature = null;
  await order.save();

  res.status(200).json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc    Verify a Razorpay payment signature and finalize the order
// @route   POST /api/payment/verify
// @access  Private/Student
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  if (order.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  if (order.payment.razorpayOrderId !== razorpay_order_id) {
    return res.status(400).json({ success: false, message: 'Razorpay order mismatch' });
  }
  if (order.payment.status === 'paid') {
    return res.status(200).json({ success: true, message: 'Order already paid', order });
  }
  if (order.status !== 'pending_payment') {
    return res.status(400).json({ success: false, message: `Cannot verify payment for an order in status '${order.status}'` });
  }

  // The only step that actually proves payment happened: recompute the
  // expected signature server-side with the secret key and compare.
  // The frontend telling us "payment succeeded" is never trusted alone.
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    order.payment.status = 'failed';
    order.payment.attemptCount = (order.payment.attemptCount || 0) + 1;
    order.payment.lastAttemptAt = new Date();
    await order.save();
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  order.payment.razorpayPaymentId = razorpay_payment_id;
  order.payment.razorpaySignature = razorpay_signature;
  order.payment.status = 'paid';
  order.status = 'paid';
  order.queueNumber = await nextQueueNumber();
  order.qrToken = signQrToken(order, { _id: order.student });
  await order.save();

  const updatedOrder = await Order.findById(order._id).populate('student', 'name email');
  const safeOrder = updatedOrder.toObject();
  delete safeOrder.qrToken;
  safeOrder.queueSnapshot = buildQueueSnapshot(updatedOrder, await Order.find({ status: { $in: ['paid', 'preparing', 'ready'] } }).sort({ queueNumber: 1, createdAt: 1 }));

  emitOrderUpdateToStudent(order.student, safeOrder);
  emitOrderUpdateToStaff(safeOrder);

  res.status(200).json({ success: true, message: 'Payment verified, order confirmed', order: safeOrder });
});

// @desc    Mark a pending order payment as cancelled or failed so the student
// can retry without creating a duplicate order.
// @route   POST /api/payment/cancel
// @access  Private/Student
const cancelPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  if (order.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  if (order.status !== 'pending_payment') {
    return res.status(400).json({ success: false, message: `Order is already ${order.status}` });
  }

  await rollbackStock(order.stockDecremented);
  order.status = 'cancelled';
  order.payment.status = 'cancelled';
  order.payment.lastAttemptAt = new Date();
  order.payment.razorpayPaymentId = null;
  order.payment.razorpaySignature = null;
  await order.save();

  res.status(200).json({ success: true, message: 'Payment cancelled. You can try again.', order });
});

module.exports = { createPaymentOrder, verifyPayment, cancelPayment };
