const express = require('express');
const { signup, login, getMe, createWorker, getWorkers } = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../utils/validators');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/create-worker', protect, authorize('admin'), createWorker);
router.get('/workers', protect, authorize('admin'), getWorkers);

module.exports = router;
