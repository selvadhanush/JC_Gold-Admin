import api from './api';

const CMSService = {
  getBanners: async () => {
    const response = await api.get('/cms/banners');
    return response.data;
  },

  createBanner: async (data) => {
    const response = await api.post('/cms/banners', data);
    return response.data;
  },

  getContent: async (type) => {
    const response = await api.get(`/cms/content/${type}`);
    return response.data;
  },

  upsertContent: async (data) => {
    const response = await api.post('/cms/content', data);
    return response.data;
  },

  triggerNotification: async (data) => {
    const response = await api.post('/cms/notify', data);
    return response.data;
  }
};

export default CMSService;
