import api from './api';

export const getCart = async () => {
  const res = await api.get('/cart');
  return res.data;
};

export const addToCart = async (foodId, quantity = 1) => {
  const res = await api.post('/cart/add', { foodId, quantity });
  return res.data;
};

export const updateCartItem = async (foodId, quantity) => {
  const res = await api.put('/cart/update', { foodId, quantity });
  return res.data;
};

export const removeFromCart = async (foodId) => {
  const res = await api.delete('/cart/remove', { data: { foodId } });
  return res.data;
};
