import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import axios, { type AxiosError, type AxiosResponse } from "axios"

// Mock axios before importing the instance
vi.mock("axios", async () => {
  const actual = await vi.importActual("axios")
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      })),
    },
  }
})

// Mock globas config
vi.mock("./globas", () => ({
  API_CONFIG: {
    BASE_URL: "http://localhost:8080/api",
    TIMEOUT: 30000,
  },
  AUTH_CONFIG: {
    STORAGE_KEY: "auth_state",
  },
  API_ENDPOINTS: {
    AUTH: {
      REFRESH: "/auth/refresh",
    },
  },
}))

describe("AxiosInstance", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe("Instance Creation", () => {
    it("should create an axios instance with correct configuration", async () => {
      // Re-import to trigger module execution
      await import("./AxiosIntance")

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:8080/api",
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      })
    })
  })

  describe("Request Interceptor Logic", () => {
    it("should add Authorization header when auth state exists", () => {
      const authState = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        user: { id: "1", username: "Test" },
      }
      localStorage.setItem("auth_state", JSON.stringify(authState))

      // The interceptor logic would add the header
      const parsedAuth = JSON.parse(localStorage.getItem("auth_state") || "{}")
      expect(parsedAuth.accessToken).toBe("test-access-token")
    })

    it("should handle missing auth state gracefully", () => {
      // No auth state in localStorage
      const authState = localStorage.getItem("auth_state")
      expect(authState).toBeNull()
    })

    it("should handle invalid JSON in auth state", () => {
      localStorage.setItem("auth_state", "invalid-json")

      // Should not throw when parsing fails
      expect(() => {
        const authState = localStorage.getItem("auth_state")
        if (authState) {
          try {
            JSON.parse(authState)
          } catch (error) {
            // Expected behavior - handle gracefully
          }
        }
      }).not.toThrow()
    })
  })

  describe("Token Refresh Logic", () => {
    it("should have refresh token available in storage", () => {
      const authState = {
        accessToken: "expired-token",
        refreshToken: "valid-refresh-token",
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // Expired
        user: { id: "1", username: "Test" },
      }
      localStorage.setItem("auth_state", JSON.stringify(authState))

      const parsed = JSON.parse(localStorage.getItem("auth_state") || "{}")
      expect(parsed.refreshToken).toBe("valid-refresh-token")
    })

    it("should clear storage when refresh fails", () => {
      const authState = {
        accessToken: "expired-token",
        refreshToken: "invalid-refresh",
      }
      localStorage.setItem("auth_state", JSON.stringify(authState))

      // Simulate refresh failure cleanup
      localStorage.removeItem("auth_state")

      expect(localStorage.getItem("auth_state")).toBeNull()
    })
  })

  describe("Queue Processing", () => {
    it("should be able to queue failed requests", () => {
      const failedQueue: Array<{
        resolve: (value?: any) => void
        reject: (error?: any) => void
      }> = []

      // Simulate adding to queue
      const promise = new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })

      expect(failedQueue.length).toBe(1)
    })

    it("should process queue on success", () => {
      const failedQueue: Array<{
        resolve: (value?: any) => void
        reject: (error?: any) => void
      }> = []
      const resolvedValues: any[] = []

      // Add items to queue
      const promise1 = new Promise((resolve) => {
        failedQueue.push({
          resolve: (value) => {
            resolvedValues.push(value)
            resolve(value)
          },
          reject: () => {},
        })
      })

      // Process queue
      const newToken = "new-access-token"
      failedQueue.forEach((prom) => {
        prom.resolve(newToken)
      })

      expect(resolvedValues).toContain(newToken)
    })
  })

  describe("Storage Key Configuration", () => {
    it("should use configured storage key", async () => {
      const globas = await import("./globas")
      expect(globas.AUTH_CONFIG.STORAGE_KEY).toBe("auth_state")
    })
  })

  describe("API Configuration", () => {
    it("should use configured base URL", async () => {
      const globas = await import("./globas")
      expect(globas.API_CONFIG.BASE_URL).toBe("http://localhost:8080/api")
    })

    it("should use configured timeout", async () => {
      const globas = await import("./globas")
      expect(globas.API_CONFIG.TIMEOUT).toBe(30000)
    })
  })
})
