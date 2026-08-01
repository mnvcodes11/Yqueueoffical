const express = require('express');
const {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require('../controllers/foodController');
const { foodValidation } = require('../utils/validators');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

// Public - anyone (logged in student or not) can browse the menu
router.get('/', getFoods);
router.get('/:id', getFoodById);

// Admin only
router.post('/', protect, authorize('admin'), foodValidation, createFood);
router.put('/:id', protect, authorize('admin'), updateFood);
router.delete('/:id', protect, authorize('admin'), deleteFood);

module.exports = router;
