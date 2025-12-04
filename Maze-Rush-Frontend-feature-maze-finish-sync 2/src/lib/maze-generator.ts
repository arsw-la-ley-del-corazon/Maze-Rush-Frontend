/**
 * Maze Generator using Depth-First Search (DFS) Algorithm
 * Creates a perfect maze with a single solution path
 */

export type Cell = {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

export type Maze = Cell[][]

/**
 * Fisher-Yates shuffle algorithm
 */
const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Generates a maze using the DFS algorithm
 * @param width - Width of the maze (number of cells)
 * @param height - Height of the maze (number of cells)
 * @returns A 2D array representing the maze
 */
export const generateMaze = (width: number, height: number): Maze => {
  // Initialize maze with all walls
  const maze: (Cell & { visited: boolean })[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      top: true,
      right: true,
      bottom: true,
      left: true,
      visited: false,
    }))
  )

  const stack: [number, number][] = []
  
  // Start at the top-left corner (0, 0)
  const startX = 0
  const startY = 0

  maze[startY][startX].visited = true
  stack.push([startX, startY])

  // DFS algorithm to carve paths
  while (stack.length > 0) {
    const [x, y] = stack.pop()!

    // Get all unvisited neighbors
    const neighbors: { x: number; y: number; dir: "N" | "E" | "S" | "W" }[] = []
    
    if (y > 0 && !maze[y - 1][x].visited) neighbors.push({ x, y: y - 1, dir: "N" })
    if (x < width - 1 && !maze[y][x + 1].visited) neighbors.push({ x: x + 1, y, dir: "E" })
    if (y < height - 1 && !maze[y + 1][x].visited) neighbors.push({ x, y: y + 1, dir: "S" })
    if (x > 0 && !maze[y][x - 1].visited) neighbors.push({ x: x - 1, y, dir: "W" })

    if (neighbors.length > 0) {
      // Push current cell back to stack
      stack.push([x, y])
      
      // Choose a random unvisited neighbor
      const { x: nextX, y: nextY, dir } = shuffle(neighbors)[0]

      // Remove walls between current cell and chosen neighbor
      if (dir === "N") {
        maze[y][x].top = false
        maze[nextY][nextX].bottom = false
      } else if (dir === "E") {
        maze[y][x].right = false
        maze[nextY][nextX].left = false
      } else if (dir === "S") {
        maze[y][x].bottom = false
        maze[nextY][nextX].top = false
      } else if (dir === "W") {
        maze[y][x].left = false
        maze[nextY][nextX].right = false
      }

      // Mark neighbor as visited and push to stack
      maze[nextY][nextX].visited = true
      stack.push([nextX, nextY])
    }
  }

  // Define entry point at top-left
  maze[0][0].top = false
  
  // Define exit point at bottom-right
  maze[height - 1][width - 1].bottom = false

  // Remove the 'visited' property before returning
  return maze.map((row) => row.map(({ top, right, bottom, left }) => ({ top, right, bottom, left })))
}

/**
 * Converts maze size string to grid dimensions
 */
export const getMazeDimensions = (mazeSize: string): { width: number; height: number } => {
  switch (mazeSize.toLowerCase()) {
    case "pequeño":
      return { width: 10, height: 10 }
    case "mediano":
      return { width: 20, height: 20 }
    case "grande":
      return { width: 30, height: 30 }
    default:
      return { width: 20, height: 20 }
  }
}
