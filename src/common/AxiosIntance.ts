import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { API_CONFIG } from './globas';

// Crear instancia de axios usando la configuración de las variables de entorno
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  // Habilitar el envío de cookies en todas las peticiones
  withCredentials: true,
});

// Interceptor de request para prevenir seguir redirecciones OAuth2
axiosInstance.interceptors.request.use(
  (config) => {
    // Prevenir que axios siga redirecciones automáticamente
    config.maxRedirects = 0;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    // Si es una redirección a OAuth2, tratarla como 401 no autenticado
    if (error.response?.status === 302 || error.response?.status === 301) {
      const location = error.response.headers?.location || '';
      if (location.includes('oauth2') || location.includes('google')) {
        // Tratar como no autenticado
        return Promise.reject({
          response: {
            status: 401,
            data: { message: 'No autenticado' }
          }
        });
      }
    }
    
    // Si el token está expirado o es inválido, NO redirigir automáticamente
    // Dejar que los componentes manejen el error 401
    if (error.response?.status === 401) {
      // Solo redirigir si NO estamos en páginas públicas
      const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
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
