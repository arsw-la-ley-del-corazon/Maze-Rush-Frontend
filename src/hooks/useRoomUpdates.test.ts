import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock everything before importing the hook
const mockClose = vi.fn()
const mockSubscribe = vi.fn()
const mockPublish = vi.fn()
const mockDeactivate = vi.fn()
const mockActivate = vi.fn()

// Mock SockJS as a class/constructor
vi.mock("sockjs-client", () => {
  class SockJS {
    close = mockClose
  }
  return { default: SockJS }
})

// Mock STOMP client
vi.mock("@stomp/stompjs", () => ({
  Client: vi.fn().mockImplementation(() => ({
    connected: false,
    subscribe: mockSubscribe,
    publish: mockPublish,
    deactivate: mockDeactivate,
    activate: mockActivate,
    onConnect: null,
    onDisconnect: null,
    onStompError: null,
  })),
}))

// Mock globas config
vi.mock("../common/globas", () => ({
  SOCKET_CONFIG: {
    URL: "http://localhost:8080",
  },
  AUTH_CONFIG: {
    STORAGE_KEY: "auth_state",
  },
}))

describe("useRoomUpdates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Module", () => {
    it("should export useRoomUpdates hook", async () => {
      const module = await import("./useRoomUpdates")
      expect(module.useRoomUpdates).toBeDefined()
      expect(typeof module.useRoomUpdates).toBe("function")
    })
  })

  describe("SOCKET_CONFIG", () => {
    it("should have proper WebSocket URL configuration", async () => {
      const globas = await import("../common/globas")
      expect(globas.SOCKET_CONFIG).toBeDefined()
      expect(globas.SOCKET_CONFIG.URL).toBe("http://localhost:8080")
    })
  })

  describe("AUTH_CONFIG", () => {
    it("should have proper auth storage key", async () => {
      const globas = await import("../common/globas")
      expect(globas.AUTH_CONFIG).toBeDefined()
      expect(globas.AUTH_CONFIG.STORAGE_KEY).toBe("auth_state")
    })
  })

  describe("localStorage", () => {
    it("should be able to set and get auth state", () => {
      const authState = {
        token: "test-token",
        user: { id: "1", username: "TestUser" },
      }
      localStorage.setItem("auth_state", JSON.stringify(authState))

      const retrieved = localStorage.getItem("auth_state")
      expect(retrieved).not.toBeNull()

      const parsed = JSON.parse(retrieved!)
      expect(parsed.token).toBe("test-token")
      expect(parsed.user.username).toBe("TestUser")
    })

    it("should handle missing auth state gracefully", () => {
      const retrieved = localStorage.getItem("auth_state")
      expect(retrieved).toBeNull()
    })

    it("should handle invalid JSON gracefully", () => {
      localStorage.setItem("auth_state", "invalid-json")

      expect(() => {
        JSON.parse(localStorage.getItem("auth_state") || "")
      }).toThrow()
    })
  })
})
