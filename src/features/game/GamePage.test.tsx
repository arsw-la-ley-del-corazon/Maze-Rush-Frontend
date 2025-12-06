import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import GamePage from "./GamePage"
import { MemoryRouter } from "react-router-dom"
import type { MazeCell } from "./services/mazeService"

// ----------------------------------------------------------------------
// 1. MOCKS ESTRATÉGICOS (Igual que antes)
// ----------------------------------------------------------------------

vi.mock("../../context/useAuth", () => ({
  useAuth: () => ({
    user: { username: "HeroeTest", avatarColor: "#000" },
  }),
}))

const mockSendMove = vi.fn()
const mockSendFinish = vi.fn()
const mockDisconnect = vi.fn()

vi.mock("../../context/useGameSocket", () => ({
  useGameSocket: () => ({
    isConnected: true,
    sendMove: mockSendMove,
    sendFinish: mockSendFinish,
    disconnect: mockDisconnect,
    onPlayerMove: vi.fn(),
    onPlayerFinish: vi.fn(),
    onPlayerJoined: vi.fn(),
    onPlayerLeft: vi.fn(),
    onGameSync: vi.fn(),
  }),
}))

const mockCells: MazeCell[][] = [
  [
    { top: true, bottom: false, left: true, right: false }, 
    { top: true, bottom: false, left: false, right: true }, 
  ],
  [
    { top: false, bottom: true, left: true, right: false }, 
    { top: false, bottom: true, left: false, right: true }, 
  ],
]

vi.mock("./services/mazeService", () => ({
  generateMazeFromBackend: vi.fn(() =>
    Promise.resolve({
      ok: true,
      data: {
        layout: [],
        startX: 0,
        startY: 0,
        goalX: 1,
        goalY: 1,
        width: 2,
        height: 2,
      },
    })
  ),
  convertLayoutToCells: vi.fn(() => mockCells),
}))

vi.mock("../../components/Maze", () => ({
  Maze: ({ playerPosition, isGameWon }: any) => (
    <div 
      data-testid="maze-component" 
      data-player-x={playerPosition.x} 
      data-player-y={playerPosition.y}
      data-won={isGameWon.toString()}
    >
      Maze Board
    </div>
  ),
}))

vi.mock("../../components/WinDialog", () => ({
  WinDialog: ({ isOpen }: any) => (
    isOpen ? <div data-testid="win-dialog">Ganaste</div> : null
  ),
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ code: "LOBBY123" }),
  }
})

// ----------------------------------------------------------------------
// 2. TESTS CORREGIDOS
// ----------------------------------------------------------------------

describe("GamePage Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // ⚠️ ELIMINADO: vi.useFakeTimers() causaba el timeout en waitFor
  })

  // ⚠️ ELIMINADO: afterEach(...)

  it("carga el juego y posiciona al jugador en el inicio (0,0)", async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    )

    // waitFor ahora usará el reloj real y funcionará rápido
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull())

    const maze = screen.getByTestId("maze-component")
    expect(maze).toHaveAttribute("data-player-x", "0")
    expect(maze).toHaveAttribute("data-player-y", "0")
  })

  it("mueve al jugador hacia abajo cuando se presiona la flecha abajo", async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull())

    fireEvent.keyDown(window, { key: "ArrowDown" })

    const maze = screen.getByTestId("maze-component")
    expect(maze).toHaveAttribute("data-player-x", "0")
    expect(maze).toHaveAttribute("data-player-y", "1")
    
    expect(mockSendMove).toHaveBeenCalledWith({ x: 0, y: 1 })
  })

  it("NO mueve al jugador si hay una pared (Colisión)", async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull())

    // Intento mover arriba desde (0,0), donde hay pared
    fireEvent.keyDown(window, { key: "ArrowUp" })

    const maze = screen.getByTestId("maze-component")
    // Se mantiene en 0,0
    expect(maze).toHaveAttribute("data-player-x", "0")
    expect(maze).toHaveAttribute("data-player-y", "0")
    
    expect(mockSendMove).not.toHaveBeenCalled()
  })

  it("detecta la victoria al llegar a la meta (1,1)", async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull())

    // Ruta: Abajo -> Derecha
    fireEvent.keyDown(window, { key: "ArrowDown" })
    fireEvent.keyDown(window, { key: "ArrowRight" })

    const maze = screen.getByTestId("maze-component")
    expect(maze).toHaveAttribute("data-player-x", "1")
    expect(maze).toHaveAttribute("data-player-y", "1")

    // Verificar llamada al backend
    expect(mockSendFinish).toHaveBeenCalled()
    
    // Verificar UI de victoria
    expect(screen.getByTestId("win-dialog")).toBeInTheDocument()
    expect(maze).toHaveAttribute("data-won", "true")
  })

  it("usa controles WASD también", async () => {
    render(
      <MemoryRouter>
        <GamePage />
      </MemoryRouter>
    )
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull())

    // 's' es Abajo
    fireEvent.keyDown(window, { key: "s" })

    const maze = screen.getByTestId("maze-component")
    expect(maze).toHaveAttribute("data-player-y", "1")
  })
})