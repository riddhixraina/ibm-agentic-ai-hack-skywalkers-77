import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://ibm-agentic-ai-hack-skywalkers-77.vercel.app';

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

export const toolsAPI = {
  testCreateTicket: (data) => api.post('/api/skills/create-ticket', data, {
    headers: { 'x-api-key': 'demo-key' }
  }),
  testPostSocial: (data) => api.post('/api/skills/post-social', data, {
    headers: { 'x-api-key': 'demo-key' }
  }),
  testNotifyOps: (data) => api.post('/api/skills/notify-ops', data, {
    headers: { 'x-api-key': 'demo-key' }
  }),
  testFetchKB: (query) => api.get(`/api/skills/kb-search?q=${encodeURIComponent(query)}`, {
    headers: { 'x-api-key': 'demo-key' }
  }),
  testIngestEvent: (data) => api.post('/api/skills/ingest-event', data, {
    headers: { 'x-api-key': 'demo-key' }
  }),
  testSocialMonitor: (params) => api.get('/api/skills/social-monitor', {
    params,
    headers: { 'x-api-key': 'demo-key' }
  }),
};

// Export api instance
export { api };
export default api;

