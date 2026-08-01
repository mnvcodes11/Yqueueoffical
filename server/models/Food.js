const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Meals', 'Snacks', 'Drinks', 'Desserts'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
    available: {
      type: Boolean,
      default: true,
    },
    // Optional tracked stock count. null/undefined = unlimited (only `available`
    // gates orderability, matching Phase 1 behavior). When set to a number,
    // the order engine atomically decrements it on checkout and blocks
    // ordering once it hits 0.
    stock: {
      type: Number,
      default: null,
      min: [0, 'Stock cannot be negative'],
    },
  },
  { timestamps: true }
);

foodSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Food', foodSchema);
