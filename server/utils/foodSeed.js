const Food = require('../models/Food');

const seededFoods = [
  {
    name: 'Masala Dosa',
    description: 'Crispy dosa served with sambar and chutney, a campus staple.',
    category: 'South Indian',
    price: 45,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    available: true,
    stock: 25,
    prepTime: '10-15 min',
    isVeg: true,
    isSpecial: true,
    isBestseller: true,
  },
  {
    name: 'Paneer Wrap',
    description: 'Spiced paneer wrap with lettuce and mint chutney.',
    category: 'Snacks',
    price: 70,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80',
    available: true,
    stock: 18,
    prepTime: '8-10 min',
    isVeg: true,
    isSpecial: false,
    isBestseller: true,
  },
  {
    name: 'Veg Fried Rice',
    description: 'Quick veg fried rice with mixed vegetables and soy sauce.',
    category: 'Chinese',
    price: 95,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80',
    available: true,
    stock: 12,
    prepTime: '12-15 min',
    isVeg: true,
    isSpecial: false,
    isBestseller: false,
  },
  {
    name: 'Veg Maggi',
    description: 'Classic instant noodles with onion, tomato, and capsicum.',
    category: 'Meals',
    price: 40,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80',
    available: true,
    stock: 30,
    prepTime: '5-8 min',
    isVeg: true,
    isSpecial: true,
    isBestseller: false,
  },
  {
    name: 'Cold Coffee',
    description: 'Chilled coffee with a hint of cocoa for study breaks.',
    category: 'Beverages',
    price: 55,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    available: true,
    stock: 20,
    prepTime: '3-5 min',
    isVeg: true,
    isSpecial: false,
    isBestseller: true,
  },
];

const seedFoods = async () => {
  const count = await Food.countDocuments();
  if (count > 0) return;

  await Food.insertMany(seededFoods);
};

module.exports = { seedFoods };
