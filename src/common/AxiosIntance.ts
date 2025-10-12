import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, AUTH_CONFIG } from './globas';

// Crear instancia de axios usando la configuración de las variables de entorno
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las peticiones
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener token del localStorage usando la clave configurada
    const authState = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
    if (authState) {
      try {
        const parsed = JSON.parse(authState);
        if (parsed.accessToken) {
          config.headers.Authorization = `Bearer ${parsed.accessToken}`;
        }
      } catch (error) {
        console.error('Error parsing auth state:', error);
      }
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    // Si el token está expirado o es inválido, limpiar el estado
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
      // Redirigir al login si es necesario
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;