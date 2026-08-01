import api from './api';

export const checkout = async () => {
  const res = await api.post('/orders/checkout');
  return res.data;
};

export const getMyOrders = async () => {
  const res = await api.get('/orders/my');
  return res.data;
};

export const getOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};

export const getKitchenOrders = async (status) => {
  const res = await api.get('/orders/kitchen', { params: status ? { status } : {} });
  return res.data;
};

export const getStaffOrders = async (status) => {
  const res = await api.get('/orders/staff', { params: status ? { status } : {} });
  return res.data;
};

export const updateOrderStatus = async (id, status) => {
  const res = await api.patch(`/orders/${id}/status`, { status });
  return res.data;
};
