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

const router = express.Router();

router.use(protect);

router.post('/checkout', authorize('student'), checkout);
router.get('/my', authorize('student'), getMyOrders);
router.get('/kitchen', authorize('worker', 'admin'), getKitchenOrders);
router.get('/staff', authorize('worker', 'admin'), getStaffOrders);
router.patch('/:id/status', authorize('worker', 'admin'), updateOrderStatus);
router.get('/:id', getOrderById); // ownership/staff check happens inside the controller

module.exports = router;
