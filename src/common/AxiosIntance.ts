import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
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
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    config.maxRedirects = 0;
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: AxiosError): Promise<AxiosError> => {
    // Handle redirects (301, 302)
    if (error.response?.status === 302 || error.response?.status === 301) {
      const location = (error.response.headers?.location as string) || '';
      if (location.includes('oauth2') || location.includes('google')) {
        return Promise.reject({
          response: {
            status: 401,
            data: { message: 'No autenticado' },
          },
        });
      }
    }

    // Handle unauthorized access (401)
    if (error.response?.status === 401) {
      const publicPaths = ['/login', '/signup'];
      const isPublicPath = publicPaths.some((path) =>
        window.location.pathname.startsWith(path)
      );

      if (!isPublicPath && !window.location.pathname.startsWith('/oauth2')) {
        console.warn('No autenticado, redirigiendo al login...');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
