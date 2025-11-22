import axiosInstance from "../../../common/AxiosIntance"
import type { Result } from "../../../types/api"

/**
 * Maze entity returned by the backend
 */
export interface MazeEntity {
  id: string
  size: string
  width: number
  height: number
  layout: number[][] // JSON parsed from backend
  startX: number
  startY: number
  goalX: number
  goalY: number
}

/**
 * Cell structure for maze rendering
 */
export interface MazeCell {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

/**
 * Generate a new maze from the backend
 * @param size - "SMALL", "MEDIUM", or "LARGE"
 */
export async function generateMazeFromBackend(size: string): Promise<Result<MazeEntity>> {
  try {
    const response = await axiosInstance.post<MazeEntity>(`/api/v1/map/generate/${size.toUpperCase()}`)
    return { ok: true, data: response.data }
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { message?: string } } }
    return {
      ok: false,
      error: {
        status: err.response?.status || 500,
        message: err.response?.data?.message || "Error generando el laberinto",
        path: `/api/v1/map/generate/${size}`,
      },
    }
  }
}

/**
 * Get a maze by ID from the backend
 * @param id - UUID of the maze
 */
export async function getMazeById(id: string): Promise<Result<MazeEntity>> {
  try {
    const response = await axiosInstance.get<MazeEntity>(`/api/v1/map/${id}`)
    return { ok: true, data: response.data }
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { message?: string } } }
    return {
      ok: false,
      error: {
        status: err.response?.status || 500,
        message: err.response?.data?.message || "Error obteniendo el laberinto",
        path: `/api/v1/map/${id}`,
      },
    }
  }
}

/**
 * Convert backend maze layout (number[][]) to cell structure for rendering
 * Backend: 0 = path, 1 = wall
 */
export function convertLayoutToCells(layout: number[][]): MazeCell[][] {
  const height = layout.length
  const width = layout[0].length
  const cells: MazeCell[][] = []

  for (let y = 0; y < height; y++) {
    const row: MazeCell[] = []
    for (let x = 0; x < width; x++) {
      const isWall = layout[y][x] === 1
      
      // If current cell is a wall, all borders are walls
      if (isWall) {
        row.push({ top: true, right: true, bottom: true, left: true })
        continue
      }

      // Current cell is a path, check neighbors
      const cell: MazeCell = {
        top: y === 0 || layout[y - 1][x] === 1,
        right: x === width - 1 || layout[y][x + 1] === 1,
        bottom: y === height - 1 || layout[y + 1][x] === 1,
        left: x === 0 || layout[y][x - 1] === 1,
      }
      row.push(cell)
    }
    cells.push(row)
  }

  return cells
}
