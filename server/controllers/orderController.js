const Cart = require('../models/Cart');
const Food = require('../models/Food');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { emitOrderUpdateToStudent, emitOrderUpdateToStaff } = require('../socket');
const { buildQueueSnapshot } = require('../utils/queueService');

// Statuses a worker/admin is allowed to hand-advance an order through.
// 'ready' -> 'collected' is intentionally NOT included here: that transition
// only happens via a verified QR scan (see qrController), never a manual button.
const MANUAL_STATUS_TRANSITIONS = {
  pending_payment: ['cancelled'],
  paid: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
};

// Atomically decrements stock for food items that track it. If any item runs
// out mid-loop, every prior decrement in this order is rolled back so a
// failed checkout never leaves stock permanently short.
const reserveStock = async (items) => {
  const decremented = [];

  for (const item of items) {
    const food = await Food.findById(item.food._id);
    if (!food || !food.available) {
      await rollbackStock(decremented);
      return { ok: false, message: `${item.food.name || 'An item'} is no longer available` };
    }

    if (food.stock === null || food.stock === undefined) {
      // Unlimited/untracked stock - nothing to reserve.
      continue;
    }

    const updated = await Food.findOneAndUpdate(
      { _id: food._id, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!updated) {
      await rollbackStock(decremented);
      return { ok: false, message: `Not enough stock left for ${food.name}` };
    }

    decremented.push({ food: food._id, quantity: item.quantity });
  }

  return { ok: true, decremented };
};

const rollbackStock = async (decremented) => {
  await Promise.all(
    decremented.map(({ food, quantity }) => Food.findByIdAndUpdate(food, { $inc: { stock: quantity } }))
  );
};

// @desc    Convert the logged-in student's cart into a pending order
// @route   POST /api/orders/checkout
// @access  Private/Student
const checkout = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ student: req.user._id }).populate('items.food');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty' });
  }

  // Filter out any item whose food was deleted after being added to the cart.
  const validItems = cart.items.filter((item) => item.food);
  if (validItems.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid items in cart' });
  }

  const reservation = await reserveStock(validItems);
  if (!reservation.ok) {
    return res.status(409).json({ success: false, message: reservation.message });
  }

  const orderItems = validItems.map((item) => ({
    food: item.food._id,
    name: item.food.name,
    price: item.food.price,
    quantity: item.quantity,
  }));
  const totalPrice = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const estimatedTime = Math.max(10, Math.min(30, 10 + orderItems.reduce((sum, item) => sum + item.quantity, 0) * 2));

  const order = await Order.create({
    student: req.user._id,
    items: orderItems,
    totalPrice,
    estimatedTime,
    status: 'pending_payment',
    stockDecremented: reservation.decremented,
  });

  // Clear the cart now that it has become an order. If payment is never
  // completed, a cleanup job (or the payment failure handler) restocks and
  // cancels this order - see paymentController.
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  res.status(201).json({ success: true, message: 'Order created, proceed to payment', order });
});

// @desc    Get the logged-in student's own order history
// @route   GET /api/orders/my
// @access  Private/Student
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ student: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @desc    Get a single order (owner student, or any worker/admin)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const isOwner = order.student.toString() === req.user._id.toString();
  const isStaff = ['worker', 'admin'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  res.status(200).json({ success: true, order });
});

// @desc    Live kitchen queue - all orders currently in flight (paid onward)
// @route   GET /api/orders/kitchen?status=paid|preparing|ready
// @access  Private/Worker,Admin
const getKitchenOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status
    ? { status }
    : { status: { $in: ['paid', 'preparing', 'ready'] } };

  const orders = await Order.find(query)
    .populate('student', 'name email')
    .populate('workerAssigned', 'name')
    .sort({ queueNumber: 1, createdAt: 1 });
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @desc    Staff history for completed/cancelled orders.
// @route   GET /api/orders/staff?status=collected|cancelled
// @access  Private/Worker,Admin
const getStaffOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status
    ? { status }
    : { status: { $in: ['preparing', 'ready', 'collected', 'cancelled'] } };

  const orders = await Order.find(query)
    .populate('student', 'name email')
    .populate('workerAssigned', 'name')
    .sort({ updatedAt: -1, createdAt: -1 });

  res.status(200).json({ success: true, count: orders.length, orders });
});

// @desc    Advance an order's status (paid -> preparing -> ready), or cancel it
// @route   PATCH /api/orders/:id/status
// @access  Private/Worker,Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status: nextStatus } = req.body;
  if (!nextStatus) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const allowed = MANUAL_STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    return res.status(400).json({
      success: false,
      message: `Cannot move an order from '${order.status}' to '${nextStatus}'`,
    });
  }

  if (nextStatus === 'cancelled') {
    await rollbackStock(order.stockDecremented);
  }

  if (['preparing', 'ready'].includes(nextStatus) && order.payment.status !== 'paid') {
    return res.status(400).json({ success: false, message: 'Only paid orders can move to preparing or ready' });
  }

  order.workerAssigned = req.user._id;
  order.status = nextStatus;
  if (nextStatus === 'ready') {
    order.estimatedTime = Math.max(order.estimatedTime || 15, 5);
  }
  await order.save();

  const enrichedOrder = await Order.findById(order._id).populate('student', 'name email').populate('workerAssigned', 'name');
  const queueSnapshot = buildQueueSnapshot(enrichedOrder, await Order.find({ status: { $in: ['paid', 'preparing', 'ready'] } }).sort({ queueNumber: 1, createdAt: 1 }));
  const payload = enrichedOrder.toObject();
  payload.queueSnapshot = queueSnapshot;

  emitOrderUpdateToStudent(enrichedOrder.student, payload);
  emitOrderUpdateToStaff(payload);

  res.status(200).json({ success: true, message: `Order marked as ${nextStatus}`, order: payload });
});

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  getKitchenOrders,
  getStaffOrders,
  updateOrderStatus,
  reserveStock,
  rollbackStock,
};
