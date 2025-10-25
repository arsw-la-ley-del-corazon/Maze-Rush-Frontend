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

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    // Si el token está expirado o es inválido, redirigir al login
    if (error.response?.status === 401) {
      // Redirigir al login si es necesario
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/oauth2')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
