/**
 * RTTPS - Centralized Axios API Client
 * Automatically manages Authorization headers and provides structured methods for all backend modules.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rttps_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Clear invalid token
        // localStorage.removeItem('rttps_token');
        // localStorage.removeItem('rttps_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Train Service
export const trainService = {
  searchTrains: (params) => api.get('/trains/search', { params }),
  getAllTrains: () => api.get('/trains'),
  getTrainDetails: (identifier) => api.get(`/trains/${identifier}`),
  createTrain: (trainData) => api.post('/trains', trainData),
  updateTrain: (id, trainData) => api.put(`/trains/${id}`, trainData),
  deleteTrain: (id) => api.delete(`/trains/${id}`),
  updateStatus: (id, statusData) => api.patch(`/trains/${id}/status`, statusData)
};

// Schedule Service
export const scheduleService = {
  getTrainSchedule: (trainNumber) => api.get(`/schedules/${trainNumber}`),
  updatePlatform: (id, platformData) => api.patch(`/schedules/${id}/platform`, platformData),
  overrideEta: (overrideData) => api.post('/schedules/override-eta', overrideData)
};

// Tracking Service
export const trackingService = {
  getTrainTracking: (trainNumber) => api.get(`/tracking/${trainNumber}`),
  getFleetLocations: () => api.get('/tracking/fleet/all'),
  controlSimulator: (controlData) => api.post('/tracking/simulation/control', controlData),
  injectAnomaly: (anomalyData) => api.post('/tracking/simulation/inject', anomalyData)
};

// Prediction Service (Machine Learning)
export const predictionService = {
  getTrainPrediction: (trainNumber) => api.get(`/predictions/${trainNumber}`),
  calculatePrediction: (payload) => api.post('/predictions/calculate', payload),
  getModelMetrics: () => api.get('/predictions/metrics/evaluation'),
  retrainModel: () => api.post('/predictions/retrain')
};

// Notification Service
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  broadcastAlert: (alertData) => api.post('/notifications/broadcast', alertData)
};

// Analytics & Reports Service
export const analyticsService = {
  getDashboardStats: () => api.get('/analytics/dashboard-stats'),
  getCharts: () => api.get('/analytics/charts'),
  getHistoricalRecords: (params) => api.get('/analytics/historical-records', { params })
};

export default api;
