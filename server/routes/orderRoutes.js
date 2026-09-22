const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  checkout,
  getMyOrders,
  getOrderById,
  getKitchenOrders,
  getStaffOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { orderStatusValidation, kitchenOrderStatusValidation, staffOrderStatusValidation, orderIdParamValidation, orderCheckoutValidation } = require('../utils/validators');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);

router.post('/checkout', authorize('student'), orderCheckoutValidation, validateRequest, checkout);
router.get('/my', authorize('student'), getMyOrders);
router.get('/kitchen', authorize('worker', 'admin'), kitchenOrderStatusValidation, validateRequest, getKitchenOrders);
router.get('/staff', authorize('worker', 'admin'), staffOrderStatusValidation, validateRequest, getStaffOrders);
router.patch('/:id/status', authorize('worker', 'admin'), orderStatusValidation, validateRequest, updateOrderStatus);
router.get('/:id', orderIdParamValidation, validateRequest, getOrderById); // ownership/staff check happens inside the controller

module.exports = router;
