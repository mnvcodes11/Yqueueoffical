const express = require('express');
const {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require('../controllers/foodController');
const { foodValidation, foodUpdateValidation, foodIdParamValidation, foodQueryValidation } = require('../utils/validators');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { publicLimiter } = require('../middleware/rateLimiter');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Public - anyone (logged in student or not) can browse the menu
router.get('/', publicLimiter, foodQueryValidation, validateRequest, getFoods);
router.get('/:id', publicLimiter, foodIdParamValidation, validateRequest, getFoodById);

// Admin only
router.post('/', protect, authorize('admin'), foodValidation, validateRequest, createFood);
router.put('/:id', protect, authorize('admin'), foodIdParamValidation, foodUpdateValidation, validateRequest, updateFood);
router.delete('/:id', protect, authorize('admin'), foodIdParamValidation, validateRequest, deleteFood);

module.exports = router;
