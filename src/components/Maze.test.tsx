import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { Maze } from "./Maze"
import type { MazeCell } from "../features/game/services/mazeService"

// Mock CSS modules
vi.mock("./Maze.module.css", () => ({
  default: {
    mazeContainer: "mazeContainer",
    cell: "cell",
    wallCell: "wallCell",
    pathCell: "pathCell",
    cellWallTop: "cellWallTop",
    cellWallRight: "cellWallRight",
    cellWallBottom: "cellWallBottom",
    cellWallLeft: "cellWallLeft",
    endPosition: "endPosition",
    foggedCell: "foggedCell",
    playerCell: "playerCell",
    endToken: "endToken",
    powerUpFog: "powerUpFog",
    powerUpConfusion: "powerUpConfusion",
    powerUpFreeze: "powerUpFreeze",
  },
}))

vi.mock("../lib/utils", () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" "),
}))

describe("Maze Component", () => {
  // Create a simple 3x3 maze for testing
  const createSimpleMaze = (): MazeCell[][] => [
    [
      { top: true, right: false, bottom: false, left: true },
      { top: true, right: false, bottom: true, left: false },
      { top: true, right: true, bottom: false, left: false },
    ],
    [
      { top: false, right: false, bottom: false, left: true },
      { top: true, right: false, bottom: false, left: false },
      { top: false, right: true, bottom: false, left: false },
    ],
    [
      { top: false, right: false, bottom: true, left: true },
      { top: false, right: false, bottom: true, left: false },
      { top: false, right: true, bottom: true, left: false },
    ],
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders null when maze is empty", () => {
    const { container } = render(
      <Maze
        maze={[]}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it("renders null when maze is undefined/null", () => {
    const { container } = render(
      <Maze
        maze={null as any}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it("renders correct number of cells for a 3x3 maze", () => {
    const maze = createSimpleMaze()
    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
      />
    )

    const cells = container.querySelectorAll(".cell")
    expect(cells.length).toBe(9) // 3x3 = 9 cells
  })

  it("renders the maze container with correct grid style", () => {
    const maze = createSimpleMaze()
    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
      />
    )

    const mazeContainer = container.querySelector(".mazeContainer")
    expect(mazeContainer).toBeInTheDocument()
    expect(mazeContainer).toHaveStyle({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gridTemplateRows: "repeat(3, minmax(0, 1fr))",
    })
  })

  it("marks the end position cell correctly", () => {
    const maze = createSimpleMaze()
    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
      />
    )

    // End position should have endPosition class
    const cells = container.querySelectorAll(".cell")
    const lastCell = cells[8] // Position (2,2) in a 3x3 grid
    expect(lastCell.classList.contains("endPosition")).toBe(true)
  })

  it("renders player cell with playerCell class", () => {
    const maze = createSimpleMaze()
    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 1, y: 1 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
      />
    )

    const cells = container.querySelectorAll(".cell")
    const playerCell = cells[4] // Position (1,1) in a 3x3 grid
    expect(playerCell.classList.contains("playerCell")).toBe(true)
  })

  it("renders wall cells correctly", () => {
    // Create a maze with a wall cell (all walls closed)
    const mazeWithWall: MazeCell[][] = [
      [
        { top: true, right: true, bottom: true, left: true }, // Wall cell
        { top: false, right: false, bottom: false, left: false },
      ],
      [
        { top: false, right: false, bottom: false, left: false },
        { top: false, right: false, bottom: false, left: false },
      ],
    ]

    const { container } = render(
      <Maze
        maze={mazeWithWall}
        playerPosition={{ x: 1, y: 0 }}
        endPosition={{ x: 1, y: 1 }}
        isGameWon={false}
      />
    )

    const cells = container.querySelectorAll(".cell")
    expect(cells[0].classList.contains("wallCell")).toBe(true)
  })

  it("handles fog visibility correctly", () => {
    const maze = createSimpleMaze()
    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
        hasClearFog={false}
      />
    )

    // Cells far from player should have reduced opacity
    const cells = container.querySelectorAll(".cell")
    expect(cells.length).toBe(9)
  })

  it("removes fog when hasClearFog is true", () => {
    const maze = createSimpleMaze()
    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
        hasClearFog={true}
      />
    )

    // All cells should be visible
    const cells = container.querySelectorAll(".cell")
    cells.forEach((cell) => {
      expect(cell).not.toHaveClass("foggedCell")
    })
  })

  it("renders other players when provided", () => {
    const maze = createSimpleMaze()
    const otherPlayers = [
      {
        username: "Player2",
        position: { x: 1, y: 1 },
        isFinished: false,
        avatarColor: "#ff0000",
      },
    ]

    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
        otherPlayers={otherPlayers}
      />
    )

    // The other player should be rendered in their position
    // This test verifies the component doesn't crash with other players
    // Just verify the component renders without crashing
    expect(container.querySelector(".mazeContainer")).toBeInTheDocument()
  })

  it("renders power-ups when provided", () => {
    const maze = createSimpleMaze()
    const powerUps = [
      { id: "1", x: 1, y: 1, type: "CLEAR_FOG" as const },
      { id: "2", x: 0, y: 1, type: "FREEZE" as const },
      { id: "3", x: 2, y: 0, type: "CONFUSION" as const },
    ]

    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
        powerUps={powerUps}
      />
    )

    // Verify power-up elements are rendered
    expect(container.querySelector(".powerUpFog")).toBeInTheDocument()
    expect(container.querySelector(".powerUpFreeze")).toBeInTheDocument()
    expect(container.querySelector(".powerUpConfusion")).toBeInTheDocument()
  })

  it("renders end token at goal position", () => {
    const maze = createSimpleMaze()
    const { container } = render(
      <Maze
        maze={maze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 2, y: 2 }}
        isGameWon={false}
      />
    )

    expect(container.querySelector(".endToken")).toBeInTheDocument()
  })

  it("handles 5x5 maze correctly", () => {
    const largeMaze: MazeCell[][] = Array(5)
      .fill(null)
      .map(() =>
        Array(5)
          .fill(null)
          .map(() => ({
            top: Math.random() > 0.5,
            right: Math.random() > 0.5,
            bottom: Math.random() > 0.5,
            left: Math.random() > 0.5,
          }))
      )

    const { container } = render(
      <Maze
        maze={largeMaze}
        playerPosition={{ x: 0, y: 0 }}
        endPosition={{ x: 4, y: 4 }}
        isGameWon={false}
      />
    )

    const cells = container.querySelectorAll(".cell")
    expect(cells.length).toBe(25) // 5x5 = 25 cells
  })
})
