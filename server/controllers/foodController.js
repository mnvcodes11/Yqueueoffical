const { validationResult } = require('express-validator');
const Food = require('../models/Food');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all foods (supports search, category filter, availability filter)
// @route   GET /api/foods?search=&category=&available=
// @access  Public
const getFoods = asyncHandler(async (req, res) => {
  const { search, category, available } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (available !== undefined) {
    query.available = available === 'true';
  }

  const foods = await Food.find(query).sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: foods.length, foods });
});

// @desc    Get single food by id
// @route   GET /api/foods/:id
// @access  Public
const getFoodById = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);

  if (!food) {
    return res.status(404).json({ success: false, message: 'Food item not found' });
  }

  res.status(200).json({ success: true, food });
});

// @desc    Create a new food item
// @route   POST /api/foods
// @access  Private/Admin
const createFood = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }

  const { name, description, category, price, image, available, stock } = req.body;

  const food = await Food.create({
    name,
    description,
    category,
    price,
    image,
    available,
    stock: stock === '' || stock === undefined ? null : Number(stock),
  });

  res.status(201).json({ success: true, message: 'Food item created successfully', food });
});

// @desc    Update a food item
// @route   PUT /api/foods/:id
// @access  Private/Admin
const updateFood = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }

  const food = await Food.findById(req.params.id);
  if (!food) {
    return res.status(404).json({ success: false, message: 'Food item not found' });
  }

  const allowedFields = ['name', 'description', 'category', 'price', 'image', 'available', 'stock'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'stock') {
        food.stock = req.body.stock === '' || req.body.stock === null ? null : Number(req.body.stock);
      } else {
        food[field] = req.body[field];
      }
    }
  });

  await food.save();

  res.status(200).json({ success: true, message: 'Food item updated successfully', food });
});

// @desc    Delete a food item
// @route   DELETE /api/foods/:id
// @access  Private/Admin
const deleteFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);
  if (!food) {
    return res.status(404).json({ success: false, message: 'Food item not found' });
  }

  await food.deleteOne();

  res.status(200).json({ success: true, message: 'Food item deleted successfully' });
});

module.exports = { getFoods, getFoodById, createFood, updateFood, deleteFood };
