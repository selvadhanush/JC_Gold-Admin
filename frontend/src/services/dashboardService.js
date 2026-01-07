import api from './api';

const DashboardService = {
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch dashboard stats';
    }
  },

  exportSalesCSV: async () => {
    try {
      const response = await api.get('/dashboard/export/sales', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      throw error.response?.data?.message || 'Failed to export CSV';
    }
  }
};

export default DashboardService;
