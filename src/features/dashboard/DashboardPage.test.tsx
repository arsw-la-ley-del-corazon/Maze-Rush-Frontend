import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import DashboardPage from "./DashboardPage"

// Mock useAuth
vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user-123",
      username: "TestUser",
      email: "test@test.com",
      score: 100,
      level: 5,
    },
  })),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock lobbyService
vi.mock("../lobby/services/lobbyService", () => ({
  getAllLobbies: vi.fn(),
  joinLobby: vi.fn(),
}))

// Mock useRoomUpdates
vi.mock("../../hooks/useRoomUpdates", () => ({
  useRoomUpdates: vi.fn(() => ({})),
}))

import { getAllLobbies, joinLobby } from "../lobby/services/lobbyService"
import { useAuth } from "../../context/useAuth"

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Silence console logs during tests
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )
  }

  describe("Rendering", () => {
    it("should render the dashboard title", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: [] })

      renderDashboard()

      // Use getAllByText since multiple elements may contain this text
      expect(screen.getAllByText(/Salas Disponibles/i).length).toBeGreaterThan(0)
    })

    it("should render action buttons", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: [] })

      renderDashboard()

      expect(screen.getByText(/CREAR SALA/i)).toBeInTheDocument()
      expect(screen.getByText(/UNIRSE/)).toBeInTheDocument()
    })

    it("should show welcome message with username", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: [] })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/¡Hola/i)).toBeInTheDocument()
        expect(screen.getByText(/TestUser/i)).toBeInTheDocument()
      })
    })
  })

  describe("Room Loading", () => {
    it("should display loading spinner while fetching rooms", async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(getAllLobbies).mockReturnValue(pendingPromise as any)

      renderDashboard()

      expect(screen.getByRole("progressbar")).toBeInTheDocument()

      // Resolve to clean up
      await act(async () => {
        resolvePromise!({ ok: true, data: [] })
      })
    })

    it("should display rooms when loaded successfully", async () => {
      const mockRooms = [
        {
          id: "1",
          code: "ABC123",
          creatorUsername: "Host1",
          currentPlayers: 2,
          maxPlayers: 4,
          isPublic: true,
          mazeSize: "MEDIUM",
          status: "WAITING",
        },
        {
          id: "2",
          code: "DEF456",
          creatorUsername: "Host2",
          currentPlayers: 1,
          maxPlayers: 2,
          isPublic: true,
          mazeSize: "SMALL",
          status: "WAITING",
        },
      ]

      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: mockRooms })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("Host1")).toBeInTheDocument()
        expect(screen.getByText("Host2")).toBeInTheDocument()
      })
    })

    it("should display error message on load failure", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({
        ok: false,
        error: { status: 500, message: "Server error" },
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument()
      })
    })

    it("should show empty state when no rooms available", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: [] })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/No hay salas públicas disponibles/i)).toBeInTheDocument()
      })
    })
  })

  describe("Navigation", () => {
    it("should navigate to create lobby page when Create button is clicked", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: [] })

      renderDashboard()

      const createButton = screen.getByText(/Crear Sala/i)
      fireEvent.click(createButton)

      expect(mockNavigate).toHaveBeenCalledWith("/app/create-lobby")
    })
  })

  describe("Filtering", () => {
    const mockRooms = [
      {
        id: "1",
        code: "ABC123",
        creatorUsername: "Alpha",
        currentPlayers: 2,
        maxPlayers: 4,
        isPublic: true,
        mazeSize: "MEDIUM",
        status: "WAITING",
      },
      {
        id: "2",
        code: "DEF456",
        creatorUsername: "Beta",
        currentPlayers: 1,
        maxPlayers: 2,
        isPublic: true,
        mazeSize: "SMALL",
        status: "WAITING",
      },
      {
        id: "3",
        code: "GHI789",
        creatorUsername: "Gamma",
        currentPlayers: 3,
        maxPlayers: 6,
        isPublic: true,
        mazeSize: "LARGE",
        status: "WAITING",
      },
    ]

    it("should filter rooms by search query", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: mockRooms })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("Alpha")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Buscar/i)
      fireEvent.change(searchInput, { target: { value: "Alpha" } })

      await waitFor(() => {
        expect(screen.getByText("Alpha")).toBeInTheDocument()
        expect(screen.queryByText("Beta")).not.toBeInTheDocument()
        expect(screen.queryByText("Gamma")).not.toBeInTheDocument()
      })
    })
  })

  describe("Join Room", () => {
    it("should call joinLobby when join button is clicked", async () => {
      const mockRooms = [
        {
          id: "1",
          code: "ABC123",
          creatorUsername: "Host1",
          currentPlayers: 2,
          maxPlayers: 4,
          isPublic: true,
          mazeSize: "MEDIUM",
          status: "WAITING",
        },
      ]

      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: mockRooms })
      vi.mocked(joinLobby).mockResolvedValue({
        ok: true,
        data: {
          ...mockRooms[0],
          players: [],
        },
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("Host1")).toBeInTheDocument()
      })

      const joinButton = screen.getByText("UNIRME")
      await act(async () => {
        fireEvent.click(joinButton)
      })

      expect(joinLobby).toHaveBeenCalledWith("ABC123")
    })

    it("should navigate to lobby page after successful join", async () => {
      const mockRooms = [
        {
          id: "1",
          code: "ABC123",
          creatorUsername: "Host1",
          currentPlayers: 2,
          maxPlayers: 4,
          isPublic: true,
          mazeSize: "MEDIUM",
          status: "WAITING",
        },
      ]

      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: mockRooms })
      vi.mocked(joinLobby).mockResolvedValue({
        ok: true,
        data: {
          ...mockRooms[0],
          players: [],
        },
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("Host1")).toBeInTheDocument()
      })

      const joinButton = screen.getByText("UNIRME")
      await act(async () => {
        fireEvent.click(joinButton)
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/app/lobby/ABC123")
      })
    })

    it("should show error when join fails", async () => {
      const mockRooms = [
        {
          id: "1",
          code: "ABC123",
          creatorUsername: "Host1",
          currentPlayers: 4,
          maxPlayers: 4,
          isPublic: true,
          mazeSize: "MEDIUM",
          status: "WAITING",
        },
      ]

      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: mockRooms })
      vi.mocked(joinLobby).mockResolvedValue({
        ok: false,
        error: { status: 400, message: "Lobby is full" },
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("Host1")).toBeInTheDocument()
      })
    })
  })

  describe("Refresh", () => {
    it("should have a refresh button", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: [] })

      renderDashboard()

      const refreshButton = screen.getByLabelText(/Actualizar salas/i)
      expect(refreshButton).toBeInTheDocument()
    })

    it("should reload rooms when refresh button is clicked", async () => {
      vi.mocked(getAllLobbies).mockResolvedValue({ ok: true, data: [] })

      renderDashboard()

      await waitFor(() => {
        expect(getAllLobbies).toHaveBeenCalledTimes(1)
      })

      const refreshButton = screen.getByLabelText(/Actualizar salas/i)
      await act(async () => {
        fireEvent.click(refreshButton)
      })

      await waitFor(() => {
        expect(getAllLobbies).toHaveBeenCalledTimes(2)
      })
    })
  })
})
