import api from './api';

const AuditService = {
  getLogs: async (params) => {
    const response = await api.get('/audit', { params });
    return response.data;
  }
};

export default AuditService;
