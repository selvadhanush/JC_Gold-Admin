import api from './api';

const PaymentService = {
  getPayments: async (params) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getPayment: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  processRefund: async (id, data) => {
    const response = await api.post(`/payments/${id}/refund`, data);
    return response.data;
  }
};

export default PaymentService;
