const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { forgotPassword, verifyOtp, resetPassword } = require('./passwordResetController');

// @desc    Register a new student
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'student',
  });

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Login student or admin
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // If the frontend specifies which portal it's logging in from, enforce it,
  // so a student cannot log into the admin dashboard and vice versa.
  if (role && user.role !== role) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user._id, user.role);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Get currently logged in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// @desc    Admin creates a worker (canteen counter staff) account
// @route   POST /api/auth/create-worker
// @access  Private/Admin
const createWorker = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const worker = await User.create({ name, email, password, role: 'worker' });

  res.status(201).json({
    success: true,
    message: 'Worker account created successfully',
    user: { id: worker._id, name: worker.name, email: worker.email, role: worker.role },
  });
});

// @desc    Admin: list all worker (counter staff) accounts
// @route   GET /api/auth/workers
// @access  Private/Admin
const getWorkers = asyncHandler(async (req, res) => {
  const workers = await User.find({ role: 'worker' }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: workers.length, workers });
});

module.exports = { signup, login, getMe, createWorker, getWorkers, forgotPassword, verifyOtp, resetPassword };
