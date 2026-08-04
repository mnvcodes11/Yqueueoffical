import api from './api';

export const getAnalyticsSummary = async (range = 7) => {
  const res = await api.get('/analytics/summary', { params: { range } });
  return res.data;
};
