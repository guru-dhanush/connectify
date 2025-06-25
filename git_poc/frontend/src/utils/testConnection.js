import api from './api';

export const testBackendConnection = async () => {
  try {
    const response = await api.get('/api/test');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || 'Connection failed'
    };
  }
};
