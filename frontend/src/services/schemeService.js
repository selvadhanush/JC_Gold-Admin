import api from './api';

const SchemeService = {
  getSchemes: async () => {
    const response = await api.get('/schemes');
    return response.data;
  },

  createScheme: async (data) => {
    const response = await api.post('/schemes', data);
    return response.data;
  },

  enrollUser: async (data) => {
    const response = await api.post('/schemes/enroll', data);
    return response.data;
  },

  payInstallment: async (id) => {
    const response = await api.patch(`/schemes/installments/${id}/pay`);
    return response.data;
  },

  getEnrollment: async (id) => {
    const response = await api.get(`/schemes/enrollments/${id}`);
    return response.data;
  }
};

export default SchemeService;
