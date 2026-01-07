import api from './api';

const UserService = {
  getUsers: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateStatus: async (id, isActive) => {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },

  getOrderHistory: async (id) => {
    const response = await api.get(`/users/${id}/orders`);
    return response.data;
  },

  getSchemeParticipation: async (id) => {
    const response = await api.get(`/users/${id}/schemes`);
    return response.data;
  }
};

export default UserService;
