const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { createPaymentOrder, verifyPayment, cancelPayment } = require('../controllers/paymentController');
const { paymentCreateValidation, paymentVerifyValidation, paymentCancelValidation } = require('../utils/validators');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect, authorize('student'));

router.post('/create-order', paymentCreateValidation, validateRequest, createPaymentOrder);
router.post('/verify', paymentVerifyValidation, validateRequest, verifyPayment);
router.post('/cancel', paymentCancelValidation, validateRequest, cancelPayment);

module.exports = router;
