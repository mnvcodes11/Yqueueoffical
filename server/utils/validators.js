const { body } = require('express-validator');

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const foodValidation = [
  body('name').trim().notEmpty().withMessage('Food name is required'),
  body('category').isIn(['Meals', 'Snacks', 'Drinks', 'Desserts', 'South Indian', 'Chinese', 'Beverages', 'Breakfast']).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];

module.exports = { signupValidation, loginValidation, foodValidation };
