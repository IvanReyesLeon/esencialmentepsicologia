import axios from 'axios';

// La env apunta a la raíz del backend (p.ej. https://esencialmentepsicologia.onrender.com) SIN /api
export const API_ROOT = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace(/\/$/, '')) || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Si el cuerpo es FormData, dejar que el navegador establezca el boundary
  if (config.data instanceof FormData && config.headers && config.headers['Content-Type']) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const therapistAPI = {
  getAll: () => api.get('/therapists'),
  getById: (id) => api.get(`/therapists/${id}`),
  create: (data) => api.post('/therapists', data),
  updatePhoto: (id, data) => api.put(`/therapists/${id}/photo`, data),
  update: (id, data) => api.put(`/therapists/${id}`, data),
  delete: (id) => api.delete(`/therapists/${id}`),
};

export const pricingAPI = {
  getAll: () => api.get('/pricing'),
  getById: (id) => api.get(`/pricing/${id}`),
  create: (data) => api.post('/pricing', data),
  update: (id, data) => api.put(`/pricing/${id}`, data),
  delete: (id) => api.delete(`/pricing/${id}`),
};

export const workshopAPI = {
  getAll: () => api.get('/workshops'),
  getById: (id) => api.get(`/workshops/${id}`),
  create: (data) => api.post('/workshops', data),
  update: (id, data) => api.put(`/workshops/${id}`, data),
  delete: (id) => api.delete(`/workshops/${id}`),
  addImage: (id, data) => api.post(`/workshops/${id}/images`, data),
  deleteImage: (imageId) => api.delete(`/workshops/images/${imageId}`),
};

export const contactMessagesAPI = {
  getAll: (params) => api.get('/admin/contact-messages', { params }),
  getUnread: () => api.get('/admin/contact-messages/unread'),
  markAsRead: (id) => api.put(`/admin/contact-messages/${id}/read`),
  markAsUnread: (id) => api.put(`/admin/contact-messages/${id}/unread`),
  delete: (id) => api.delete(`/admin/contact-messages/${id}`),
};

export const contactAPI = {
  sendMessage: (data) => api.post('/contact', data),
};

export default api;
