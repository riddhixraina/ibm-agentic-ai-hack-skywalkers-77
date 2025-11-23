import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const executionsAPI = {
  getAll: (params = {}) => api.get('/api/executions', { params }),
  getById: (id) => api.get(`/api/executions/${id}`),
};

export const flowsAPI = {
  getAll: () => api.get('/api/flows'),
  getById: (id) => api.get(`/api/flows/${id}`),
  trigger: (flowId, input) => api.post(`/api/trigger-flow`, { flowId, input }),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;

