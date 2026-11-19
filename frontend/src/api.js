import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const predictWaterQuality = (data) => api.post('/predict', data);
export const getModelResults = () => api.get('/model-results');
export const getDiseasesInfo = () => api.get('/diseases-info');
export const getFeatureColumns = () => api.get('/feature-columns');
export const getHealth = () => api.get('/health');

export default api;
