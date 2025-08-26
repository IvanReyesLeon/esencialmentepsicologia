import axios from 'axios';

// La env apunta a la raíz (Render o localhost) SIN /api
const API_ROOT = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

export const therapistAPI = {
  getAll: () => api.get('/therapists'),
  getById: (id) => api.get(`/therapists/${id}`),
  create: (data) => api.post('/therapists', data),
  update: (id, data) => api.put(`/therapists/${id}`, data),
  delete: (id) => api.delete(`/therapists/${id}`),
};

export const pricingAPI = {
  getAll: () => api.get('/pricing'),
  getById: (id) => api.get(`/pricing/${id}`),
  update: (data) => api.post('/pricing', data),
  delete: (id) => api.delete(`/pricing/${id}`),
};

export const contactAPI = {
  sendMessage: (data) => api.post('/contact', data),
};

export default api;
