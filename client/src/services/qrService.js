import api from './api';

export const getQr = async (orderId) => {
  const res = await api.get(`/qr/${orderId}`);
  return res.data;
};

export const verifyQr = async (token) => {
  const res = await api.post('/qr/verify', { token });
  return res.data;
};
