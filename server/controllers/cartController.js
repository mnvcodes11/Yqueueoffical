const Cart = require('../models/Cart');
const Food = require('../models/Food');
const asyncHandler = require('../utils/asyncHandler');

// Recalculates and persists totalPrice for a populated cart document.
const recalculateTotal = async (cart) => {
  await cart.populate('items.food');
  cart.totalPrice = cart.items.reduce((sum, item) => {
    // Guard against a food item that was deleted after being added to a cart
    if (!item.food) return sum;
    return sum + item.food.price * item.quantity;
  }, 0);
  await cart.save();
  return cart;
};

// @desc    Get logged-in student's cart
// @route   GET /api/cart
// @access  Private/Student
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ student: req.user._id }).populate('items.food');

  if (!cart) {
    cart = await Cart.create({ student: req.user._id, items: [], totalPrice: 0 });
  }

  res.status(200).json({ success: true, cart });
});

// @desc    Add an item to the cart (or increase quantity if it already exists)
// @route   POST /api/cart/add
// @access  Private/Student
const addToCart = asyncHandler(async (req, res) => {
  const { foodId, quantity = 1 } = req.body;

  if (!foodId) {
    return res.status(400).json({ success: false, message: 'foodId is required' });
  }
  if (quantity < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
  }

  const food = await Food.findById(foodId);
  if (!food) {
    return res.status(404).json({ success: false, message: 'Food item not found' });
  }
  if (!food.available) {
    return res.status(400).json({ success: false, message: 'This food item is currently unavailable' });
  }

  let cart = await Cart.findOne({ student: req.user._id });
  if (!cart) {
    cart = await Cart.create({ student: req.user._id, items: [] });
  }

  const existingItem = cart.items.find((item) => item.food.toString() === foodId);
  if (existingItem) {
    existingItem.quantity += Number(quantity);
  } else {
    cart.items.push({ food: foodId, quantity: Number(quantity) });
  }

  await cart.save();
  cart = await recalculateTotal(cart);

  res.status(200).json({ success: true, message: 'Item added to cart', cart });
});

// @desc    Update quantity of an item already in the cart
// @route   PUT /api/cart/update
// @access  Private/Student
const updateCartItem = asyncHandler(async (req, res) => {
  const { foodId, quantity } = req.body;

  if (!foodId || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'foodId and quantity are required' });
  }
  if (quantity < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be at least 1. Use remove instead.' });
  }

  const cart = await Cart.findOne({ student: req.user._id });
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Cart not found' });
  }

  const item = cart.items.find((i) => i.food.toString() === foodId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found in cart' });
  }

  item.quantity = Number(quantity);
  await cart.save();
  const updatedCart = await recalculateTotal(cart);

  res.status(200).json({ success: true, message: 'Cart updated', cart: updatedCart });
});

// @desc    Remove an item from the cart
// @route   DELETE /api/cart/remove
// @access  Private/Student
const removeFromCart = asyncHandler(async (req, res) => {
  const { foodId } = req.body;

  if (!foodId) {
    return res.status(400).json({ success: false, message: 'foodId is required' });
  }

  const cart = await Cart.findOne({ student: req.user._id });
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Cart not found' });
  }

  cart.items = cart.items.filter((item) => item.food.toString() !== foodId);
  await cart.save();
  const updatedCart = await recalculateTotal(cart);

  res.status(200).json({ success: true, message: 'Item removed from cart', cart: updatedCart });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
