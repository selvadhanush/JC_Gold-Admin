import api from './api';

const OrderService = {
  getOrders: async (params) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  cancelOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },

  getInvoice: async (id) => {
    const response = await api.get(`/orders/${id}/invoice`);
    return response.data;
  }
};

export default OrderService;
