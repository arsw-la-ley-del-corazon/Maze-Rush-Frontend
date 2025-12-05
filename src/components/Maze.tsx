// src/components/Maze.tsx
import type { PlayerGameState } from "../types/api"
import type { MazeCell } from "../features/game/services/mazeService"
import { cn } from "../lib/utils"
import styles from "./Maze.module.css"

interface MazeProps {
  maze: MazeCell[][]
  playerPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
  isGameWon: boolean
  otherPlayers?: PlayerGameState[]
}

/**
 * Maze component that renders the maze grid and player position
 * Adapts to different maze sizes and displays walls based on cell data
 * Supports multiplayer by rendering other players' positions
 * Implements fog of war for limited visibility
 */
export function Maze({
  maze,
  playerPosition,
  endPosition,
  isGameWon,
  otherPlayers = [],
}: MazeProps) {
  if (!maze || maze.length === 0) {
    return null
  }

  const width = maze[0].length
  const height = maze.length

  // Fog of war radius - adjust this value to change visibility range
  const VISION_RADIUS = 3

  /**
   * Calculate if a cell is visible based on player position
   * Uses Manhattan distance for fog of war effect
   */
  const isCellVisible = (cellX: number, cellY: number): boolean => {
    const distance = Math.abs(cellX - playerPosition.x) + Math.abs(cellY - playerPosition.y)
    return distance <= VISION_RADIUS
  }

  /**
   * Calculate visibility level for gradual fog effect
   * Returns a value between 0 (invisible) and 1 (fully visible)
   */
  const getVisibilityLevel = (cellX: number, cellY: number): number => {
    const distance = Math.abs(cellX - playerPosition.x) + Math.abs(cellY - playerPosition.y)
    if (distance > VISION_RADIUS) return 0
    if (distance === 0) return 1
    // Much steeper falloff for dramatic fog effect
    return Math.max(0, 1 - (distance / VISION_RADIUS) * 0.95)
  }

  return (
    <div
      className={styles.mazeContainer}
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
      }}
    >
      {maze.map((row, y) =>
        row.map((cell, x) => {
          const isPlayer = playerPosition.x === x && playerPosition.y === y
          const isEnd = endPosition.x === x && endPosition.y === y
          const otherPlayersHere = otherPlayers.filter(
            (p) => p.position.x === x && p.position.y === y,
          )

          // Check if this cell is a wall (all borders are true)
          const isWall = cell.top && cell.right && cell.bottom && cell.left

          // Calculate visibility
          const isVisible = isCellVisible(x, y)
          const visibilityLevel = getVisibilityLevel(x, y)

          return (
            <div
              key={`${y}-${x}`}
              className={cn(
                styles.cell,
                isWall ? styles.wallCell : styles.pathCell,
                !isWall && cell.top && styles.cellWallTop,
                !isWall && cell.right && styles.cellWallRight,
                !isWall && cell.bottom && styles.cellWallBottom,
                !isWall && cell.left && styles.cellWallLeft,
                isEnd && !isWall && styles.endPosition,
                !isVisible && styles.foggedCell,
                isPlayer && styles.playerCell,
              )}
              style={{
                opacity: isVisible ? visibilityLevel : 0,
                transition: "opacity 0.4s ease-in-out",
                filter: isVisible ? "none" : "blur(8px)",
              }}
            >
              {/* Solo renderizar contenido si la celda es visible */}
              {isVisible && (
                <>
                  {isEnd && !isWall && <div className={styles.endToken} />}

                  {/* Otros jugadores en esta celda: SOLO el monito de color */}
                  {!isWall &&
                    otherPlayersHere.map((player, idx) => (
                      <div
                        key={player.username}
                        className={styles.otherPlayerToken}
                        style={{
                          // MUY IMPORTANTE: usar "color" para que afecte currentColor
                          color: player.avatarColor || "#FF6B6B",
                          transform: `translate(${idx * 4}px, ${idx * 4}px)`,
                          zIndex: 10 + idx,
                        }}
                        title={player.username}
                      />
                    ))}

                  {/* Jugador actual: celda brillante + monito amarillo */}
                  {isPlayer && !isWall && (
                    <div
                      className={cn(
                        styles.playerToken,
                        isGameWon && styles.playerTokenWinning,
                      )}
                    />
                  )}
                </>
              )}
            </div>
          )
        }),
      )}
    </div>
  )
}
