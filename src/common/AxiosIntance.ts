import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios"
import { API_CONFIG, API_ENDPOINTS, AUTH_CONFIG } from "./globas"

// Crear instancia de axios usando la configuración de las variables de entorno
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
})

// Flag para evitar múltiples intentos de refresh simultáneos
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Interceptor para añadir el token a las peticiones
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener token del localStorage usando la clave configurada
    const authState = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY)
    if (authState) {
      try {
        const parsed = JSON.parse(authState)
        if (parsed.accessToken) {
          config.headers.Authorization = `Bearer ${parsed.accessToken}`
        }
      } catch (error) {
        console.error("Error parsing auth state:", error)
      }
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Si el token está expirado o es inválido (401)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Si ya estamos refrescando, agregar la petición a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return axiosInstance(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      // Intentar refrescar el token
      const authState = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY)
      if (authState) {
        try {
          const parsed = JSON.parse(authState)
          if (parsed.refreshToken) {
            try {
              // Crear una instancia temporal sin interceptores para evitar loops infinitos
              const refreshResponse = await axios
                .create({
                  baseURL: API_CONFIG.BASE_URL,
                  timeout: API_CONFIG.TIMEOUT,
                  headers: {
                    "Content-Type": "application/json",
                  },
                })
                .post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken: parsed.refreshToken })

              const newAccessToken = refreshResponse.data.accessToken
              const newRefreshToken = refreshResponse.data.refreshToken || parsed.refreshToken
              const newExpiresAt = refreshResponse.data.expiresAt

              // Actualizar el localStorage con los nuevos tokens
              localStorage.setItem(
                AUTH_CONFIG.STORAGE_KEY,
                JSON.stringify({
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                  expiresAt: newExpiresAt,
                  user: parsed.user,
                })
              )

              // Actualizar el header de la petición original
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
              }

              // Procesar la cola de peticiones fallidas
              processQueue(null, newAccessToken)
              isRefreshing = false

              // Reintentar la petición original
              return axiosInstance(originalRequest)
            } catch (refreshError) {
              // Si el refresh falla, limpiar todo y redirigir
              processQueue(refreshError, null)
              isRefreshing = false
              localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)

              // Redirigir al login si es necesario
              if (
                window.location.pathname !== "/login" &&
                !window.location.pathname.startsWith("/oauth2")
              ) {
                window.location.href = "/login"
              }

              return Promise.reject(refreshError)
            }
          }
        } catch (parseError) {
          // Error al parsear el localStorage
          processQueue(parseError, null)
          isRefreshing = false
          localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)
        }
      }

      // Si no hay refreshToken, limpiar y redirigir
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY)
      isRefreshing = false

      if (
        window.location.pathname !== "/login" &&
        !window.location.pathname.startsWith("/oauth2")
      ) {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
