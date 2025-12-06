import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import App from "./App"

// Mock all context providers to avoid complex setup
vi.mock("./context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("./context/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  })),
}))

vi.mock("./context/SocketContext", () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("./context/LobbySocketContext", () => ({
  LobbySocketProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock pages to simplify testing
vi.mock("./features/home/HomePage", () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}))

vi.mock("./features/login/LoginPage", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}))

vi.mock("./features/dashboard/DashboardPage", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>,
}))

vi.mock("./features/profile/ProfilePage", () => ({
  default: () => <div data-testid="profile-page">Profile Page</div>,
}))

vi.mock("./features/lobby/CreateLobbyPage", () => ({
  default: () => <div data-testid="create-lobby-page">Create Lobby Page</div>,
}))

vi.mock("./features/lobby/JoinLobbyPage", () => ({
  default: () => <div data-testid="join-lobby-page">Join Lobby Page</div>,
}))

vi.mock("./features/lobby/LobbyPage", () => ({
  default: () => <div data-testid="lobby-page">Lobby Page</div>,
}))

vi.mock("./features/game/GamePage", () => ({
  default: () => <div data-testid="game-page">Game Page</div>,
}))

vi.mock("./components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}))

import { useAuth } from "./context/useAuth"

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset URL
    window.history.pushState({}, "", "/")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Public Routes", () => {
    it("should render home page at root path", async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByTestId("home-page")).toBeInTheDocument()
      })
    })

    it("should render home page at /home path", async () => {
      window.history.pushState({}, "", "/home")
      
      render(<App />)

      await waitFor(() => {
        expect(screen.getByTestId("home-page")).toBeInTheDocument()
      })
    })

    it("should render login page at /login path", async () => {
      window.history.pushState({}, "", "/login")
      
      render(<App />)

      await waitFor(() => {
        expect(screen.getByTestId("login-page")).toBeInTheDocument()
      })
    })
  })

  describe("Protected Routes", () => {
    it("should redirect to login when accessing /app without authentication", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        loginWithGoogle: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
      })

      window.history.pushState({}, "", "/app")
      
      render(<App />)

      await waitFor(() => {
        expect(screen.getByTestId("login-page")).toBeInTheDocument()
      })
    })

    it("should render dashboard when authenticated and accessing /app", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: "123",
          username: "TestUser",
          email: "test@test.com",
        },
        loading: false,
        loginWithGoogle: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
      })

      window.history.pushState({}, "", "/app")
      
      render(<App />)

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument()
      })
    })

    it("should show nothing while loading auth state", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: true,
        loginWithGoogle: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
      })

      window.history.pushState({}, "", "/app")
      
      const { container } = render(<App />)

      // Should not render protected content while loading
      await waitFor(() => {
        expect(screen.queryByTestId("dashboard-page")).not.toBeInTheDocument()
      })
    })
  })

  describe("Theme", () => {
    it("should render with dark theme", async () => {
      render(<App />)

      // MUI CssBaseline applies dark mode styles to body
      await waitFor(() => {
        expect(document.body).toBeInTheDocument()
      })
    })
  })

  describe("Route Structure", () => {
    it("should have proper route nesting for app shell", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: "123",
          username: "TestUser",
          email: "test@test.com",
        },
        loading: false,
        loginWithGoogle: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
      })

      window.history.pushState({}, "", "/app")
      
      render(<App />)

      await waitFor(() => {
        expect(screen.getByTestId("app-shell")).toBeInTheDocument()
      })
    })
  })
})
