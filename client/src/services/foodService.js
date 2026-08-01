import api from './api';

export const getFoods = async (params = {}) => {
  const res = await api.get('/foods', { params });
  return res.data;
};

export const getFoodById = async (id) => {
  const res = await api.get(`/foods/${id}`);
  return res.data;
};

export const createFood = async (data) => {
  const res = await api.post('/foods', data);
  return res.data;
};

export const updateFood = async (id, data) => {
  const res = await api.put(`/foods/${id}`, data);
  return res.data;
};

export const deleteFood = async (id) => {
  const res = await api.delete(`/foods/${id}`);
  return res.data;
};
