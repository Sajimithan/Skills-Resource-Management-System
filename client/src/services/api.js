import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const personnelApi = {
    getAll: () => api.get('/personnel'),
    getById: (id) => api.get(`/personnel/${id}`),
    create: (data) => api.post('/personnel', data),
    update: (id, data) => api.put(`/personnel/${id}`, data),
    delete: (id) => api.delete(`/personnel/${id}`),
    assignSkill: (id, data) => api.post(`/personnel/${id}/skills`, data),
};

export const skillsApi = {
    getAll: () => api.get('/skills'),
    create: (data) => api.post('/skills', data),
    update: (id, data) => api.put(`/skills/${id}`, data),
    delete: (id) => api.delete(`/skills/${id}`),
};

export const projectsApi = {
    getAll: () => api.get('/projects'),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    addRequirement: (id, data) => api.post(`/projects/${id}/requirements`, data),
    assignPersonnel: (id, data) => api.post(`/projects/${id}/assign`, data),
    unassign: (projectId, personnelId) => api.delete(`/projects/${projectId}/assign/${personnelId}`),
};

export const matchingApi = {
    getMatches: (projectId) => api.get(`/matching/${projectId}`),
};

export const dashboardApi = {
    getStats: () => api.get('/dashboard'),
};

export default api;
