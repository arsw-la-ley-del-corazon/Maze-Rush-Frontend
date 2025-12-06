import axiosInstance from "../../../common/AxiosIntance"
import type { Result } from "../../../types/api"

/**
 * Maze entity returned by the backend
 * Note: layout comes as a JSON string from backend and needs parsing
 */
export interface MazeEntityRaw {
  id: string
  size: string
  width: number
  height: number
  layout: string // JSON string from backend
  startX: number
  startY: number
  goalX: number
  goalY: number
}

/**
 * Maze entity with parsed layout
 */
export interface MazeEntity {
  id: string
  size: string
  width: number
  height: number
  layout: number[][] // Parsed array
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
    const response = await axiosInstance.post<MazeEntityRaw>(`/map/generate/${size.toUpperCase()}`)
    const rawData = response.data

    // Parse the layout JSON string to array
    let layout: number[][]
    if (typeof rawData.layout === "string") {
      layout = JSON.parse(rawData.layout)
    } else {
      layout = rawData.layout as unknown as number[][]
    }

    const parsedData: MazeEntity = {
      ...rawData,
      layout,
    }

    return { ok: true, data: parsedData }
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { message?: string } } }
    return {
      ok: false,
      error: {
        status: err.response?.status || 500,
        message: err.response?.data?.message || "Error generando el laberinto",
        path: `/map/generate/${size}`,
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
 * This creates a cell for each position, with borders indicating where walls are
 */
export function convertLayoutToCells(layout: number[][]): MazeCell[][] {
  const height = layout.length
  const width = layout[0]?.length || 0
  const cells: MazeCell[][] = []

  if (width === 0 || height === 0) {
    return cells
  }

  for (let y = 0; y < height; y++) {
    const row: MazeCell[] = []
    for (let x = 0; x < width; x++) {
      const isWall = layout[y][x] === 1

      // For wall cells, all borders are solid
      if (isWall) {
        row.push({ top: true, right: true, bottom: true, left: true })
        continue
      }

      // For path cells, check neighbors to determine which borders should be walls
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
