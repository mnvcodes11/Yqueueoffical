const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { cartAddValidation, cartUpdateValidation } = require('../utils/validators');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// All cart routes require a logged-in student
router.use(protect, authorize('student'));

router.get('/', getCart);
router.post('/add', cartAddValidation, validateRequest, addToCart);
router.put('/update', cartUpdateValidation, validateRequest, updateCartItem);
router.delete('/remove', cartAddValidation, validateRequest, removeFromCart);

module.exports = router;
