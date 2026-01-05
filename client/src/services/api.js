import axios from 'axios';

// URL del backend en Render
const RENDER_BACKEND_URL = 'https://esencialmentepsicologia.onrender.com';

// Detectar si estamos en producción (runtime check)
const isProduction = typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

// En producción, usar la URL de Render directamente
// En desarrollo, usar localhost:3001
export const API_ROOT = isProduction ? RENDER_BACKEND_URL : 'http://localhost:3001';

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
  getAll: (includeAll = false) => api.get(`/workshops${includeAll ? '?all=true' : ''}`),
  getById: (id) => api.get(`/workshops/${id}`),
  create: (data) => api.post('/workshops', data),
  update: (id, data) => api.put(`/workshops/${id}`, data),
  delete: (id) => api.delete(`/workshops/${id}`),
  deletePermanently: (id) => api.delete(`/workshops/${id}/permanent`),
  addImage: (id, data) => api.post(`/workshops/${id}/images`, data),
  deleteImage: (imageId) => api.delete(`/workshops/images/${imageId}`),
  // Inscripciones
  register: (id, data) => api.post(`/workshops/${id}/register`, data),
  getRegistrations: (id) => api.get(`/workshops/${id}/registrations`),
  addManualRegistration: (id, data) => api.post(`/workshops/${id}/registrations/manual`, data),
  updateRegistration: (registrationId, data) => api.put(`/workshops/registrations/${registrationId}`, data),
  deleteRegistration: (registrationId) => api.delete(`/workshops/registrations/${registrationId}`),
  getStats: (id) => api.get(`/workshops/${id}/stats`),
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

export const billingAPI = {
  getGlobal: (calendarId) => api.get('/admin/billing/global', { params: { calendarId } }),
  getMe: (calendarId) => api.get('/admin/billing/me', { params: { calendarId } }),
  // Invoice logic
  submitInvoice: (data) => api.post('/admin/billing/submit-invoice', data),
  checkInvoiceStatus: (params) => api.get('/admin/billing/invoice-status', { params }),
  getSubmissions: (params) => api.get('/admin/billing/invoice-submissions', { params }),
  validateInvoice: (data) => api.post('/admin/billing/validate-invoice', data),
  revokeInvoice: (data) => api.post('/admin/billing/revoke-invoice', data),
  // Quarterly Reports
  getQuarterlyReport: (params) => api.get('/admin/billing/quarterly', { params }),
  saveQuarterlyReport: (data) => api.post('/admin/billing/quarterly', data),
};

export const notificationsAPI = {
  getAll: () => api.get('/admin/notifications'),
  markAsRead: (id) => api.put(`/admin/notifications/${id}/read`),
  markAllAsRead: () => api.put('/admin/notifications/read-all'),
};

export const expensesAPI = {
  getAll: (params) => api.get('/admin/expenses', { params }),
  create: (data) => api.post('/admin/expenses', data),
  delete: (id) => api.delete(`/admin/expenses/${id}`),
  generateMonthly: (data) => api.post('/admin/expenses/generate-monthly', data),

  // Recurring
  getRecurring: () => api.get('/admin/expenses/recurring'),
  createRecurring: (data) => api.post('/admin/expenses/recurring', data),
  updateRecurring: (id, data) => api.put(`/admin/expenses/recurring/${id}`, data),
  deleteRecurring: (id) => api.delete(`/admin/expenses/recurring/${id}`),
};

export default api;
