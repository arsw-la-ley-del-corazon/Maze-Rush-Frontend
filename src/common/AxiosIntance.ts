import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { API_CONFIG } from './globas';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.maxRedirects = 0;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    if (error.response?.status === 302 || error.response?.status === 301) {
      const location = error.response.headers?.location || '';
      if (location.includes('oauth2') || location.includes('google')) {
        return Promise.reject({
          response: {
            status: 401,
            data: { message: 'No autenticado' }
          }
        });
      }
    }
    
    if (error.response?.status === 401) {
      const publicPaths = ['/login', '/signup'];
      const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path));
      
      if (!isPublicPath && !window.location.pathname.startsWith('/oauth2')) {
        console.warn('No autenticado, redirigiendo al login...');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
