import { describe, it, expect, vi, beforeEach } from "vitest"
import { generateMaze, type Maze, type Cell } from "./maze-generator"

describe("generateMaze", () => {
  beforeEach(() => {
    // Reset Math.random to be deterministic for testing
    vi.spyOn(Math, "random").mockImplementation(() => 0.5)
  })

  it("should generate a maze with correct dimensions", () => {
    const width = 5
    const height = 5
    const maze = generateMaze(width, height)

    expect(maze.length).toBe(height)
    expect(maze[0].length).toBe(width)
  })

  it("should create cells with wall properties", () => {
    const maze = generateMaze(3, 3)
    const cell = maze[0][0]

    expect(cell).toHaveProperty("top")
    expect(cell).toHaveProperty("right")
    expect(cell).toHaveProperty("bottom")
    expect(cell).toHaveProperty("left")
  })

  it("should have an entry point at top-left (top wall removed)", () => {
    const maze = generateMaze(5, 5)
    expect(maze[0][0].top).toBe(false)
  })

  it("should have an exit point at bottom-right (bottom wall removed)", () => {
    const width = 5
    const height = 5
    const maze = generateMaze(width, height)
    expect(maze[height - 1][width - 1].bottom).toBe(false)
  })

  it("should generate a perfect maze (all cells reachable)", () => {
    vi.spyOn(Math, "random").mockRestore()
    const maze = generateMaze(4, 4)
    
    // In a perfect maze, all cells should have at least one open wall
    // (except the outer boundaries)
    let allCellsHaveOpenWalls = true
    
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        const cell = maze[y][x]
        const hasOpenWall = !cell.top || !cell.right || !cell.bottom || !cell.left
        if (!hasOpenWall) {
          allCellsHaveOpenWalls = false
        }
      }
    }
    
    expect(allCellsHaveOpenWalls).toBe(true)
  })

  it("should handle 1x1 maze", () => {
    const maze = generateMaze(1, 1)
    
    expect(maze.length).toBe(1)
    expect(maze[0].length).toBe(1)
    expect(maze[0][0].top).toBe(false) // Entry
    expect(maze[0][0].bottom).toBe(false) // Exit
  })

  it("should handle rectangular maze (wider than tall)", () => {
    const maze = generateMaze(10, 5)
    
    expect(maze.length).toBe(5)
    expect(maze[0].length).toBe(10)
  })

  it("should handle rectangular maze (taller than wide)", () => {
    const maze = generateMaze(5, 10)
    
    expect(maze.length).toBe(10)
    expect(maze[0].length).toBe(5)
  })

  it("should create connected paths between adjacent cells", () => {
    vi.spyOn(Math, "random").mockRestore()
    const maze = generateMaze(5, 5)
    
    // Check that when a cell has an open wall, the adjacent cell's corresponding wall is also open
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        const cell = maze[y][x]
        
        // Check right connection
        if (x < maze[0].length - 1 && !cell.right) {
          expect(maze[y][x + 1].left).toBe(false)
        }
        
        // Check bottom connection
        if (y < maze.length - 1 && !cell.bottom) {
          expect(maze[y + 1][x].top).toBe(false)
        }
      }
    }
  })

  it("should not have 'visited' property in returned maze cells", () => {
    const maze = generateMaze(3, 3)
    
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        expect(maze[y][x]).not.toHaveProperty("visited")
      }
    }
  })
})
