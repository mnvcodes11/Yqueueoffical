const { body, param, query } = require('express-validator');

const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').optional().isIn(['student', 'admin', 'worker']).withMessage('Role is invalid'),
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
];

const verifyOtpValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .matches(/^[0-9]{6}$/)
    .withMessage('OTP must contain only digits'),
];

const resetPasswordValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('resetToken').trim().notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Password must contain at least one special character'),
];

const createWorkerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

const foodValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Food name is required')
    .isLength({ max: 100 })
    .withMessage('Food name cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category')
    .isIn(['Meals', 'Snacks', 'Drinks', 'Desserts', 'South Indian', 'Chinese', 'Beverages', 'Breakfast'])
    .withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

const foodUpdateValidation = [
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Food name cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn(['Meals', 'Snacks', 'Drinks', 'Desserts', 'South Indian', 'Chinese', 'Beverages', 'Breakfast'])
    .withMessage('Invalid category'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('available').optional().isBoolean().withMessage('Available must be boolean'),
  body('prepTime').optional().isInt({ min: 1 }).withMessage('Prep time must be a positive integer'),
  body('isVeg').optional().isBoolean().withMessage('isVeg must be boolean'),
  body('isSpecial').optional().isBoolean().withMessage('isSpecial must be boolean'),
  body('isBestseller').optional().isBoolean().withMessage('isBestseller must be boolean'),
];

const foodIdParamValidation = [
  param('id').trim().notEmpty().isMongoId().withMessage('Food ID must be a valid MongoDB ID'),
];

const orderIdParamValidation = [
  param('id').trim().notEmpty().isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
];

const orderCheckoutValidation = [
  body('cartId').optional().trim().isMongoId().withMessage('cartId must be a valid MongoDB ID'),
];

const orderStatusValidation = [
  param('id').trim().notEmpty().isMongoId().withMessage('Order ID must be a valid MongoDB ID'),
  body('status').trim().notEmpty().withMessage('Status is required'),
];

const cartItemValidation = [
  body('foodId').trim().notEmpty().isMongoId().withMessage('foodId must be a valid MongoDB ID'),
];

const cartAddValidation = [
  ...cartItemValidation,
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const cartUpdateValidation = [
  ...cartItemValidation,
  body('quantity').notEmpty().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const kitchenOrderStatusValidation = [
  query('status')
    .optional()
    .isIn(['paid', 'preparing', 'ready'])
    .withMessage('Invalid kitchen queue status filter'),
];

const staffOrderStatusValidation = [
  query('status')
    .optional()
    .isIn(['paid', 'preparing', 'ready', 'collected', 'cancelled'])
    .withMessage('Invalid staff order status filter'),
];

const qrValidation = [
  body('token').trim().notEmpty().withMessage('QR token is required'),
];

const paymentCreateValidation = [
  body('orderId').trim().notEmpty().isMongoId().withMessage('orderId must be a valid ID'),
];

const paymentVerifyValidation = [
  body('orderId').trim().notEmpty().isMongoId().withMessage('orderId must be a valid ID'),
  body('razorpay_order_id').trim().notEmpty().withMessage('razorpay_order_id is required'),
  body('razorpay_payment_id').trim().notEmpty().withMessage('razorpay_payment_id is required'),
  body('razorpay_signature').trim().notEmpty().withMessage('razorpay_signature is required'),
];

const paymentCancelValidation = [
  body('orderId').trim().notEmpty().isMongoId().withMessage('orderId must be a valid ID'),
];

const foodQueryValidation = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query is too long'),
  query('category')
    .optional()
    .isIn(['Meals', 'Snacks', 'Drinks', 'Desserts', 'South Indian', 'Chinese', 'Beverages', 'Breakfast'])
    .withMessage('Invalid food category'),
  query('available').optional().isBoolean().withMessage('Available must be true or false'),
];

const analyticsValidation = [
  query('range').optional().isInt({ min: 1, max: 30 }).withMessage('Range must be between 1 and 30 days'),
  query('type')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'semester', 'custom'])
    .withMessage('Invalid report type'),
  query('startDate').optional().isISO8601().toDate().withMessage('startDate must be an ISO8601 date'),
  query('endDate').optional().isISO8601().toDate().withMessage('endDate must be an ISO8601 date'),
];

module.exports = {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  createWorkerValidation,
  foodValidation,
  foodUpdateValidation,
  foodIdParamValidation,
  foodQueryValidation,
  cartAddValidation,
  cartUpdateValidation,
  orderIdParamValidation,
  orderCheckoutValidation,
  orderStatusValidation,
  kitchenOrderStatusValidation,
  staffOrderStatusValidation,
  qrValidation,
  paymentCreateValidation,
  paymentVerifyValidation,
  paymentCancelValidation,
  analyticsValidation,
};
