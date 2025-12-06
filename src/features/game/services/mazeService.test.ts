import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  generateMazeFromBackend,
  getMazeById,
  convertLayoutToCells,
} from "./mazeService"

// Mock axios instance
vi.mock("../../../common/AxiosIntance", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import axiosInstance from "../../../common/AxiosIntance"

describe("mazeService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("generateMazeFromBackend", () => {
    it("should successfully generate a maze", async () => {
      const mockResponse = {
        data: {
          id: "123",
          size: "MEDIUM",
          width: 20,
          height: 20,
          layout: "[[0,1],[1,0]]",
          startX: 0,
          startY: 0,
          goalX: 19,
          goalY: 19,
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValue(mockResponse)

      const result = await generateMazeFromBackend("MEDIUM")

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.id).toBe("123")
        expect(result.data.width).toBe(20)
        expect(result.data.height).toBe(20)
        expect(Array.isArray(result.data.layout)).toBe(true)
      }
    })

    it("should parse layout from JSON string", async () => {
      const mockResponse = {
        data: {
          id: "123",
          size: "SMALL",
          width: 10,
          height: 10,
          layout: "[[0,1,0],[1,0,1],[0,1,0]]",
          startX: 0,
          startY: 0,
          goalX: 9,
          goalY: 9,
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValue(mockResponse)

      const result = await generateMazeFromBackend("SMALL")

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.layout).toEqual([
          [0, 1, 0],
          [1, 0, 1],
          [0, 1, 0],
        ])
      }
    })

    it("should handle layout that is already an array", async () => {
      const mockResponse = {
        data: {
          id: "123",
          size: "SMALL",
          width: 10,
          height: 10,
          layout: [
            [0, 1],
            [1, 0],
          ],
          startX: 0,
          startY: 0,
          goalX: 9,
          goalY: 9,
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValue(mockResponse)

      const result = await generateMazeFromBackend("SMALL")

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.layout).toEqual([
          [0, 1],
          [1, 0],
        ])
      }
    })

    it("should convert size to uppercase", async () => {
      const mockResponse = {
        data: {
          id: "123",
          size: "LARGE",
          width: 30,
          height: 30,
          layout: "[[0]]",
          startX: 0,
          startY: 0,
          goalX: 29,
          goalY: 29,
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValue(mockResponse)

      await generateMazeFromBackend("large")

      expect(axiosInstance.post).toHaveBeenCalledWith("/map/generate/LARGE")
    })

    it("should return error on API failure", async () => {
      vi.mocked(axiosInstance.post).mockRejectedValue({
        response: {
          status: 500,
          data: { message: "Internal Server Error" },
        },
      })

      const result = await generateMazeFromBackend("MEDIUM")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.status).toBe(500)
        expect(result.error.message).toBe("Internal Server Error")
      }
    })

    it("should return default error message when none provided", async () => {
      vi.mocked(axiosInstance.post).mockRejectedValue({
        response: {
          status: 400,
        },
      })

      const result = await generateMazeFromBackend("MEDIUM")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe("Error generando el laberinto")
      }
    })

    it("should handle network errors", async () => {
      vi.mocked(axiosInstance.post).mockRejectedValue(new Error("Network Error"))

      const result = await generateMazeFromBackend("MEDIUM")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.status).toBe(500)
      }
    })
  })

  describe("getMazeById", () => {
    it("should successfully retrieve a maze by ID", async () => {
      const mockMaze = {
        id: "abc123",
        size: "MEDIUM",
        width: 20,
        height: 20,
        layout: [
          [0, 1],
          [1, 0],
        ],
        startX: 0,
        startY: 0,
        goalX: 19,
        goalY: 19,
      }

      vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockMaze })

      const result = await getMazeById("abc123")

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.id).toBe("abc123")
      }
    })

    it("should return error when maze not found", async () => {
      vi.mocked(axiosInstance.get).mockRejectedValue({
        response: {
          status: 404,
          data: { message: "Maze not found" },
        },
      })

      const result = await getMazeById("nonexistent")

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.status).toBe(404)
      }
    })
  })

  describe("convertLayoutToCells", () => {
    it("should convert numeric layout to MazeCell format", () => {
      // 0 = path, 1 = wall
      const layout = [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
      ]

      const cells = convertLayoutToCells(layout)

      expect(cells.length).toBe(3)
      expect(cells[0].length).toBe(3)
    })

    it("should handle empty layout", () => {
      const layout: number[][] = []

      const cells = convertLayoutToCells(layout)

      expect(cells.length).toBe(0)
    })

    it("should handle single cell layout", () => {
      const layout = [[0]]

      const cells = convertLayoutToCells(layout)

      expect(cells.length).toBe(1)
      expect(cells[0].length).toBe(1)
    })

    it("should create cells with wall properties", () => {
      const layout = [[0]]

      const cells = convertLayoutToCells(layout)
      const cell = cells[0][0]

      expect(cell).toHaveProperty("top")
      expect(cell).toHaveProperty("right")
      expect(cell).toHaveProperty("bottom")
      expect(cell).toHaveProperty("left")
    })
  })
})
