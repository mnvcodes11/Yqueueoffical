const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeFoodPayload = (input = {}) => {
  const normalized = {
    name: String(input.name || '').trim(),
    description: String(input.description || '').trim(),
    category: String(input.category || '').trim(),
    price: Number(input.price),
    image: String(input.image || '').trim(),
    available: input.available === undefined ? true : input.available === true || input.available === 'true',
    stock: input.stock === '' || input.stock === undefined || input.stock === null ? null : Number(input.stock),
    prepTime: String(input.prepTime || '').trim(),
    isVeg: input.isVeg === undefined ? true : input.isVeg === true || input.isVeg === 'true',
    isSpecial: input.isSpecial === true || input.isSpecial === 'true',
    isBestseller: input.isBestseller === true || input.isBestseller === 'true',
  };

  if (!Number.isFinite(normalized.price)) {
    normalized.price = 0;
  }

  return normalized;
};

module.exports = { normalizeFoodPayload, escapeRegex };
