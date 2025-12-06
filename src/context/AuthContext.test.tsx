import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest"
import { render, screen, waitFor, act } from "@testing-library/react"
import { AuthProvider } from "./AuthContext"
import { useAuth } from "./useAuth"
import { AUTH_CONFIG } from "../common/globas"

// Mock del servicio de autenticación
vi.mock("../features/login/services/realAuthService", () => ({
  loginWithGoogle: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
}))

import {
  loginWithGoogle as apiLoginWithGoogle,
  refresh as apiRefresh,
  logout as apiLogout,
} from "../features/login/services/realAuthService"

// Componente de prueba para acceder al contexto
function TestConsumer() {
  const { user, loading, loginWithGoogle, logout } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "ready"}</div>
      <div data-testid="user">{user ? user.username : "no-user"}</div>
      <button onClick={() => loginWithGoogle("test-credential")}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe("Initial State", () => {
    it("should start with no user and loading state", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      // Inicialmente está cargando
      await waitFor(() => {
        expect(screen.getByTestId("loading").textContent).toBe("ready")
      })
      expect(screen.getByTestId("user").textContent).toBe("no-user")
    })

    it("should restore session from localStorage if valid token exists", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEY,
        JSON.stringify({
          accessToken: "valid-access-token",
          refreshToken: "valid-refresh-token",
          expiresAt: futureExpiry,
          user: {
            id: "user-123",
            email: "test@test.com",
            username: "TestUser",
            score: 100,
            level: 5,
          },
        })
      )

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId("user").textContent).toBe("TestUser")
      })
    })

    it("should attempt refresh if token is expired but refresh token exists", async () => {
      const pastExpiry = new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEY,
        JSON.stringify({
          accessToken: "expired-access-token",
          refreshToken: "valid-refresh-token",
          expiresAt: pastExpiry,
          user: {
            id: "user-123",
            email: "test@test.com",
            username: "TestUser",
          },
        })
      )

      const newExpiry = new Date(Date.now() + 3600000).toISOString()
      vi.mocked(apiRefresh).mockResolvedValue({
        ok: true,
        data: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          tokenType: "Bearer",
          expiresIn: 3600,
          expiresAt: newExpiry,
          user: {
            id: "user-123",
            email: "test@test.com",
            username: "RefreshedUser",
            score: 100,
            level: 5,
          },
        },
      })

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(apiRefresh).toHaveBeenCalled()
      })
    })

    it("should clear storage if refresh fails", async () => {
      const pastExpiry = new Date(Date.now() - 3600000).toISOString()
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEY,
        JSON.stringify({
          accessToken: "expired-token",
          refreshToken: "invalid-refresh-token",
          expiresAt: pastExpiry,
          user: { id: "1", email: "test@test.com", username: "Test" },
        })
      )

      vi.mocked(apiRefresh).mockResolvedValue({
        ok: false,
        error: { status: 401, message: "Invalid refresh token" },
      })

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEY)).toBeNull()
      })
    })
  })

  describe("loginWithGoogle", () => {
    it("should successfully login and set user", async () => {
      const mockAuthResponse = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        tokenType: "Bearer",
        expiresIn: 3600,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        user: {
          id: "user-123",
          email: "google@test.com",
          username: "GoogleUser",
          score: 0,
          level: 1,
        },
      }

      vi.mocked(apiLoginWithGoogle).mockResolvedValue({
        ok: true,
        data: mockAuthResponse,
      })

      const TestLoginComponent = () => {
        const { loginWithGoogle, user } = useAuth()
        return (
          <div>
            <button
              data-testid="login-btn"
              onClick={async () => {
                await loginWithGoogle("google-credential")
              }}
            >
              Login
            </button>
            <div data-testid="user">{user?.username || "no-user"}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestLoginComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId("user").textContent).toBe("no-user")
      })

      await act(async () => {
        screen.getByTestId("login-btn").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("user").textContent).toBe("GoogleUser")
      })
    })

    it("should return error on login failure", async () => {
      vi.mocked(apiLoginWithGoogle).mockResolvedValue({
        ok: false,
        error: { status: 401, message: "Invalid credential" },
      })

      let loginResult: { ok: boolean; error?: string } | null = null

      const TestLoginComponent = () => {
        const { loginWithGoogle } = useAuth()
        return (
          <button
            data-testid="login-btn"
            onClick={async () => {
              loginResult = await loginWithGoogle("invalid-credential")
            }}
          >
            Login
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestLoginComponent />
        </AuthProvider>
      )

      await act(async () => {
        screen.getByTestId("login-btn").click()
      })

      await waitFor(() => {
        expect(loginResult?.ok).toBe(false)
        expect(loginResult?.error).toBe("Invalid credential")
      })
    })
  })

  describe("logout", () => {
    it("should clear user and storage on logout", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString()
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEY,
        JSON.stringify({
          accessToken: "valid-access-token",
          refreshToken: "valid-refresh-token",
          expiresAt: futureExpiry,
          user: {
            id: "user-123",
            email: "test@test.com",
            username: "TestUser",
            score: 100,
            level: 5,
          },
        })
      )

      const TestLogoutComponent = () => {
        const { logout, user } = useAuth()
        return (
          <div>
            <button data-testid="logout-btn" onClick={logout}>
              Logout
            </button>
            <div data-testid="user">{user?.username || "no-user"}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestLogoutComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId("user").textContent).toBe("TestUser")
      })

      await act(async () => {
        screen.getByTestId("logout-btn").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("user").textContent).toBe("no-user")
        expect(localStorage.getItem(AUTH_CONFIG.STORAGE_KEY)).toBeNull()
        expect(apiLogout).toHaveBeenCalledWith("valid-access-token")
      })
    })
  })

  describe("updateProfile", () => {
    it("should update user profile data", async () => {
      const futureExpiry = new Date(Date.now() + 3600000).toISOString()
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEY,
        JSON.stringify({
          accessToken: "valid-access-token",
          refreshToken: "valid-refresh-token",
          expiresAt: futureExpiry,
          user: {
            id: "user-123",
            email: "test@test.com",
            username: "OldName",
            score: 100,
            level: 5,
          },
        })
      )

      const TestUpdateComponent = () => {
        const { updateProfile, user } = useAuth()
        return (
          <div>
            <button
              data-testid="update-btn"
              onClick={() => updateProfile({ username: "NewName" })}
            >
              Update
            </button>
            <div data-testid="username">{user?.username || "no-user"}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestUpdateComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId("username").textContent).toBe("OldName")
      })

      await act(async () => {
        screen.getByTestId("update-btn").click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("username").textContent).toBe("NewName")
      })
    })
  })
})
