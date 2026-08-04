import api from './api';

export const getReport = async (type, startDate, endDate) => {
  const params = { type };
  if (type === 'custom' && startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  const res = await api.get('/analytics/report', { params });
  return res.data;
};
