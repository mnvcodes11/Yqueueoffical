const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeFoodPayload } = require('../utils/foodUtils');

test('normalizeFoodPayload turns campus-canteen input into a consistent payload', () => {
  const payload = normalizeFoodPayload({
    name: '  Masala Dosa  ',
    description: '  Crispy dosa with chutney  ',
    category: 'South Indian',
    price: '45',
    image: '  ',
    available: 'false',
    stock: '',
    prepTime: '15 min',
    isVeg: 'false',
    isSpecial: 'true',
    isBestseller: 'true',
  });

  assert.equal(payload.name, 'Masala Dosa');
  assert.equal(payload.description, 'Crispy dosa with chutney');
  assert.equal(payload.category, 'South Indian');
  assert.equal(payload.price, 45);
  assert.equal(payload.image, '');
  assert.equal(payload.available, false);
  assert.equal(payload.stock, null);
  assert.equal(payload.prepTime, '15 min');
  assert.equal(payload.isVeg, false);
  assert.equal(payload.isSpecial, true);
  assert.equal(payload.isBestseller, true);
});
