import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Therapist services
export const therapistAPI = {
  getAll: () => api.get('/therapists'),
  getById: (id) => api.get(`/therapists/${id}`),
  create: (data) => api.post('/therapists', data),
  update: (id, data) => api.put(`/therapists/${id}`, data),
  delete: (id) => api.delete(`/therapists/${id}`),
};

// Pricing services
export const pricingAPI = {
  getAll: () => api.get('/pricing'),
  getById: (id) => api.get(`/pricing/${id}`),
  update: (data) => api.post('/pricing', data),
  delete: (id) => api.delete(`/pricing/${id}`),
};

// Contact services
export const contactAPI = {
  sendMessage: (data) => api.post('/contact', data),
};

export default api;
