const mongoose = require('mongoose');

// Snapshot of a food item at the time of ordering, so later price/name edits
// on the Food document never change historical orders.
const orderItemSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ORDER_STATUSES = [
  'pending_payment', // order created, awaiting Razorpay payment
  'paid', // payment verified, waiting to be picked up by kitchen
  'preparing', // kitchen has started preparing
  'ready', // ready for pickup, QR can now be scanned
  'collected', // QR scanned by worker, order complete
  'cancelled', // payment failed / never completed / manually cancelled
];

const orderSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, 'Order must contain at least one item'],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    estimatedTime: {
      type: Number,
      default: 15,
      min: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending_payment',
      index: true,
    },
    queueNumber: {
      type: Number,
      default: null,
    },
    workerAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // -- Payment (Razorpay test mode) --
    payment: {
      razorpayOrderId: { type: String, default: null },
      razorpayPaymentId: { type: String, default: null },
      razorpaySignature: { type: String, default: null },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cancelled'],
        default: 'pending',
      },
      attemptCount: { type: Number, default: 0 },
      lastAttemptAt: { type: Date, default: null },
    },

    // -- Secure QR verification --
    // qrToken is a signed JWT (order id + purpose + short expiry) generated
    // once payment is verified. It is single-use: qrUsed flips atomically on
    // successful scan, so a screenshotted/replayed QR cannot be reused even
    // if it hasn't expired yet.
    qrToken: { type: String, default: null, select: false },
    qrUsed: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
    collectedAt: { type: Date, default: null },

    // Stock items that were atomically decremented for this order, so a
    // cancellation can restock them precisely.
    stockDecremented: [
      {
        food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        quantity: Number,
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

orderSchema.pre('validate', async function preGenerateOrderNumber(next) {
  if (this.orderNumber) return next();

  try {
    const year = new Date().getFullYear();
    const prefix = `YQ-${year}-`;
    const count = await this.constructor.countDocuments({ orderNumber: { $regex: `^${prefix}` } });
    this.orderNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

orderSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
