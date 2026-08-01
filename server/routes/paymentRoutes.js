const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { createPaymentOrder, verifyPayment, cancelPayment } = require('../controllers/paymentController');

const router = express.Router();

router.use(protect, authorize('student'));

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/cancel', cancelPayment);

module.exports = router;
