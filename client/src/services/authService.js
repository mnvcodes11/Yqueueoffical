import api from './api';

export const signup = async (data) => {
  const res = await api.post('/auth/signup', data);
  return res.data;
};

export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const createWorker = async (data) => {
  const res = await api.post('/auth/create-worker', data);
  return res.data;
};

export const getWorkers = async () => {
  const res = await api.get('/auth/workers');
  return res.data;
};
