import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock axios instance before imports
vi.mock("../../../common/AxiosIntance", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("../../../common/globas", () => ({
  API_ENDPOINTS: {
    LOBBY: {
      CREATE: "/lobby/create",
      ALL: "/lobby/all",
      GET: (code: string) => `/lobby/${code}`,
      JOIN: (code: string) => `/lobby/${code}/join`,
      LEAVE: (code: string) => `/lobby/${code}/leave`,
    },
  },
}))

import axiosInstance from "../../../common/AxiosIntance"
import {
  createLobby,
  getAllLobbies,
  getLobbyByCode,
  joinLobby,
  leaveLobby,
} from "./lobbyService"

describe("lobbyService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Silence console logs during tests
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("createLobby", () => {
    it("should successfully create a lobby", async () => {
      const mockResponse = {
        data: {
          id: "lobby-1",
          code: "ABC123",
          mazeSize: "MEDIUM",
          maxPlayers: 4,
          isPublic: true,
          status: "WAITING",
          creatorUsername: "user1",
          createdAt: new Date().toISOString(),
          players: [],
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValue(mockResponse)

      const result = await createLobby({
        mazeSize: "MEDIUM",
        maxPlayers: 4,
        isPublic: true,
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.code).toBe("ABC123")
        expect(result.data.mazeSize).toBe("MEDIUM")
        expect(result.data.isPublic).toBe(true)
      }
    })

    it("should apply workaround when isPublic is missing from response", async () => {
      const mockResponse = {
        data: {
          id: "lobby-1",
          code: "ABC123",
          mazeSize: "MEDIUM",
          maxPlayers: 4,
          status: "WAITING",
          creatorUsername: "user1",
          createdAt: new Date().toISOString(),
          players: [],
          // isPublic is missing
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValue(mockResponse)

      const result = await createLobby({
        mazeSize: "MEDIUM",
        maxPlayers: 4,
        isPublic: false,
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.isPublic).toBe(false)
      }
    })

    it("should return error on API failure", async () => {
      vi.mocked(axiosInstance.post).mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Invalid lobby configuration" },
        },
      })

      const result = await createLobby({
        mazeSize: "MEDIUM",
        maxPlayers: 4,
        isPublic: true,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.status).toBe(400)
        expect(result.error.message).toBe("Invalid lobby configuration")
      }
    })

    it("should use default error message when none provided", async () => {
      vi.mocked(axiosInstance.post).mockRejectedValue({
        response: { status: 500 },
      })

      const result = await createLobby({
        mazeSize: "MEDIUM",
        maxPlayers: 4,
        isPublic: true,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe("Error al crear el lobby")
      }
    })
  })

  describe("getAllLobbies", () => {
    it("should successfully retrieve all lobbies", async () => {
      const mockLobbies = [
        { id: "1", code: "ABC123", mazeSize: "MEDIUM", maxPlayers: 4, isPublic: true, status: "WAITING", creatorUsername: "user1", createdAt: new Date().toISOString() },
        { id: "2", code: "DEF456", mazeSize: "SMALL", maxPlayers: 2, isPublic: false, status: "WAITING", creatorUsername: "user2", createdAt: new Date().toISOString() },
      ]

      vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockLobbies })

      const result = await getAllLobbies()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.length).toBe(2)
        expect(result.data[0].code).toBe("ABC123")
        expect(result.data[1].code).toBe("DEF456")
      }
    })

    it("should return empty array when no lobbies exist", async () => {
      vi.mocked(axiosInstance.get).mockResolvedValue({ data: [] })

      const result = await getAllLobbies()

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.length).toBe(0)
      }
    })

    it("should return error on API failure", async () => {
      vi.mocked(axiosInstance.get).mockRejectedValue({
        response: {
          status: 500,
          data: { message: "Server error" },
        },
      })

      const result = await getAllLobbies()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.status).toBe(500)
        expect(result.error.message).toBe("Server error")
      }
    })
  })

  describe("getLobbyByCode", () => {
    it("should successfully retrieve a lobby by code", async () => {
      const mockLobby = {
        id: "lobby-1",
        code: "ABC123",
        mazeSize: "MEDIUM",
        maxPlayers: 4,
        isPublic: true,
        status: "WAITING",
        creatorUsername: "user1",
        createdAt: new Date().toISOString(),
        players: ["Player1", "Player2"],
      }

      vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockLobby })

      const result = await getLobbyByCode("ABC123")

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.code).toBe("ABC123")
        expect(result.data.players?.length).toBe(2)
      }
    })

    it("should return error when lobby not found", async () => {
      vi.mocked(axiosInstance.get).mockRejectedValue({
        response: {
          status: 404,
          data: { message: "Lobby not found" },
        },
      })

      const result = await getLobbyByCode("INVALID")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.status).toBe(404)
        expect(result.error.message).toBe("Lobby not found")
      }
    })
  })

  describe("joinLobby", () => {
    it("should successfully join a lobby", async () => {
      const mockLobby = {
        id: "lobby-1",
        code: "ABC123",
        mazeSize: "MEDIUM",
        maxPlayers: 4,
        isPublic: true,
        status: "WAITING",
        creatorUsername: "Host",
        createdAt: new Date().toISOString(),
        players: ["Host", "NewPlayer"],
      }

      vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockLobby })

      const result = await joinLobby("ABC123")

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.code).toBe("ABC123")
        expect(result.data.players?.length).toBe(2)
      }
    })

    it("should return error when lobby is full", async () => {
      vi.mocked(axiosInstance.post).mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Lobby is full" },
        },
      })

      const result = await joinLobby("FULL123")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe("Lobby is full")
      }
    })

    it("should return error when already in lobby", async () => {
      vi.mocked(axiosInstance.post).mockRejectedValue({
        response: {
          status: 409,
          data: { message: "Already in lobby" },
        },
      })

      const result = await joinLobby("ABC123")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.status).toBe(409)
      }
    })
  })

  describe("leaveLobby", () => {
    it("should successfully leave a lobby", async () => {
      vi.mocked(axiosInstance.delete).mockResolvedValue({ data: "Left successfully" })

      const result = await leaveLobby("ABC123")

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toBe("Left successfully")
      }
    })

    it("should return error when not in lobby", async () => {
      vi.mocked(axiosInstance.delete).mockRejectedValue({
        response: {
          status: 404,
          data: { message: "Not in lobby" },
        },
      })

      const result = await leaveLobby("ABC123")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.status).toBe(404)
        expect(result.error.message).toBe("Not in lobby")
      }
    })

    it("should use default error message when none provided", async () => {
      vi.mocked(axiosInstance.delete).mockRejectedValue({})

      const result = await leaveLobby("ABC123")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe("Error al salir del lobby")
      }
    })
  })
})
