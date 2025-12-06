import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AppShell from "./AppShell"

// Mock useAuth
const mockLogout = vi.fn()
vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user-123",
      username: "TestUser",
      email: "test@test.com",
      avatarColor: "#A46AFF",
    },
    logout: mockLogout,
  })),
}))

// Mock useNavigate and useLocation
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/app" }),
  }
})

import { useAuth } from "../context/useAuth"

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderAppShell = (children = <div>Test Content</div>) => {
    return render(
      <BrowserRouter>
        <AppShell>{children}</AppShell>
      </BrowserRouter>
    )
  }

  describe("Rendering", () => {
    it("should render the app bar with title", () => {
      renderAppShell()

      expect(screen.getByText("Maze")).toBeInTheDocument()
      expect(screen.getByText("Rush")).toBeInTheDocument()
    })

    it("should render children content", () => {
      renderAppShell(<div>My Custom Content</div>)

      expect(screen.getByText("My Custom Content")).toBeInTheDocument()
    })

    it("should display user avatar with first letter of username", () => {
      renderAppShell()

      expect(screen.getByText("T")).toBeInTheDocument() // First letter of "TestUser"
    })

    it("should display logout button", () => {
      renderAppShell()

      expect(screen.getByText("Salir")).toBeInTheDocument()
    })
  })

  describe("Navigation Drawer", () => {
    it("should open drawer when menu button is clicked", async () => {
      renderAppShell()

      const menuButton = screen.getByRole("button", { name: "" })
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText("Inicio")).toBeInTheDocument()
      })
    })

    it("should display navigation items in drawer", async () => {
      renderAppShell()

      const menuButton = screen.getByRole("button", { name: "" })
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText("Inicio")).toBeInTheDocument()
        expect(screen.getByText("Crear Lobby")).toBeInTheDocument()
        expect(screen.getByText("Perfil")).toBeInTheDocument()
      })
    })

    it("should navigate when nav item is clicked", async () => {
      renderAppShell()

      const menuButton = screen.getByRole("button", { name: "" })
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText("Perfil")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText("Perfil"))

      expect(mockNavigate).toHaveBeenCalledWith("/app/profile")
    })
  })

  describe("Logout", () => {
    it("should call logout and navigate to login when logout button is clicked", () => {
      renderAppShell()

      const logoutButton = screen.getByText("Salir")
      fireEvent.click(logoutButton)

      expect(mockLogout).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith("/login")
    })
  })

  describe("Avatar", () => {
    it("should navigate to profile when avatar is clicked", () => {
      renderAppShell()

      // Find avatar by the user's initial
      const avatars = screen.getAllByText("T")
      // Click the first avatar in the app bar
      fireEvent.click(avatars[0])

      expect(mockNavigate).toHaveBeenCalledWith("/app/profile")
    })

    it("should show user email in tooltip", () => {
      renderAppShell()

      // Avatar should have a tooltip with email
      const avatar = screen.getAllByText("T")[0]
      expect(avatar).toBeInTheDocument()
    })
  })

  describe("When user is not logged in", () => {
    it("should not crash when user is null", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        logout: mockLogout,
        loading: false,
        loginWithGoogle: vi.fn(),
        updateProfile: vi.fn(),
      })

      // This should not throw
      expect(() => renderAppShell()).not.toThrow()
    })
  })
})
