import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import ProfilePage from "./ProfilePage"

// Mock useAuth
const mockUpdateProfile = vi.fn()
vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user-123",
      username: "TestUser",
      email: "test@test.com",
      bio: "Test bio",
      preferredMazeSize: "Mediano",
      avatarColor: "#A46AFF",
      score: 100,
      level: 5,
    },
    updateProfile: mockUpdateProfile,
  })),
}))

// Mock profileService
vi.mock("./services/profileService", () => ({
  getCurrentUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  getUserStats: vi.fn(),
  validateUsername: vi.fn(),
  validateEmail: vi.fn(),
}))

import {
  getCurrentUserProfile,
  getUserStats,
  validateUsername,
  validateEmail,
} from "./services/profileService"

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    // Default mocks with all required properties
    vi.mocked(getCurrentUserProfile).mockResolvedValue({
      ok: true,
      data: {
        id: "user-123",
        username: "TestUser",
        email: "test@test.com",
        bio: "Test bio",
        preferredMazeSize: "Mediano",
        avatarColor: "#A46AFF",
        score: 100,
        level: 5,
      },
    })
    vi.mocked(getUserStats).mockResolvedValue({
      ok: true,
      data: {
        totalGames: 50,
        wins: 25,
        losses: 25,
        winRate: 50,
        currentStreak: 3,
        bestStreak: 10,
        totalScore: 1000,
        level: 5,
        lobbiesCreated: 5,
        lobbiesJoined: 10,
      },
    })
    vi.mocked(validateUsername).mockReturnValue({ valid: true })
    vi.mocked(validateEmail).mockReturnValue({ valid: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  const renderProfile = () => {
    return render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    )
  }

  describe("Rendering", () => {
    it("should render the profile page title", async () => {
      renderProfile()

      await waitFor(() => {
        expect(screen.getByText(/Mi Perfil/i)).toBeInTheDocument()
      })
    })

    it("should call getCurrentUserProfile on mount", async () => {
      renderProfile()

      await waitFor(() => {
        expect(getCurrentUserProfile).toHaveBeenCalled()
      })
    })

    it("should call getUserStats on mount", async () => {
      renderProfile()

      await waitFor(() => {
        expect(getUserStats).toHaveBeenCalled()
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle profile loading errors gracefully", async () => {
      vi.mocked(getCurrentUserProfile).mockResolvedValue({
        ok: false,
        error: { status: 500, message: "Failed to load profile" },
      })

      // Should not throw
      expect(() => renderProfile()).not.toThrow()
    })

    it("should handle stats loading errors gracefully", async () => {
      vi.mocked(getUserStats).mockResolvedValue({
        ok: false,
        error: { status: 500, message: "Failed to load stats" },
      })

      // Should not throw
      expect(() => renderProfile()).not.toThrow()
    })
  })
})
