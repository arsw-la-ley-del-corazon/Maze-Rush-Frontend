import type { MazeCell } from "../features/game/services/mazeService"
import { cn } from "../lib/utils"
// src/components/Maze.tsx
import type { PlayerGameState } from "../types/api"
import styles from "./Maze.module.css"

type PowerUpType = "CLEAR_FOG" | "FREEZE" | "CONFUSION"

interface PowerUpInstance {
  id: string
  x: number
  y: number
  type: PowerUpType
}

interface MazeProps {
  maze: MazeCell[][]
  playerPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
  isGameWon: boolean
  otherPlayers?: PlayerGameState[]
  hasClearFog?: boolean
  powerUps?: PowerUpInstance[]
}

/**
 * Maze con niebla, meta visible, jugadores y poderes.
 */
export function Maze({
  maze,
  playerPosition,
  endPosition,
  isGameWon,
  otherPlayers = [],
  hasClearFog = false,
  powerUps = [],
}: MazeProps) {
  if (!maze || maze.length === 0) {
    return null
  }

  const width = maze[0].length
  const height = maze.length

  // radio de visión
  const VISION_RADIUS = 3

  const isCellVisible = (cellX: number, cellY: number): boolean => {
    if (hasClearFog) return true
    const distance = Math.abs(cellX - playerPosition.x) + Math.abs(cellY - playerPosition.y)
    return distance <= VISION_RADIUS
  }

  const getVisibilityLevel = (cellX: number, cellY: number): number => {
    if (hasClearFog) return 1
    const distance = Math.abs(cellX - playerPosition.x) + Math.abs(cellY - playerPosition.y)
    if (distance > VISION_RADIUS) return 0
    if (distance === 0) return 1
    return Math.max(0, 1 - (distance / VISION_RADIUS) * 0.95)
  }

  const getPowerUpsAt = (x: number, y: number) => powerUps.filter((p) => p.x === x && p.y === y)

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
            (p) => p.position.x === x && p.position.y === y
          )

          const powerUpsHere = getPowerUpsAt(x, y)

          const isWall = cell.top && cell.right && cell.bottom && cell.left

          const baseVisible = isCellVisible(x, y)
          const visibilityLevel = getVisibilityLevel(x, y)

          // la meta siempre es visible
          const isVisible = isEnd ? true : baseVisible

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
                !isVisible && !isEnd && styles.foggedCell,
                isPlayer && styles.playerCell
              )}
              style={{
                opacity: isVisible ? visibilityLevel || 1 : isEnd ? 1 : 0,
                transition: "opacity 0.4s ease-in-out",
                filter: isVisible || isEnd ? "none" : "blur(8px)",
              }}
            >
              {/* Contenido solo si la celda es visible o es la meta */}
              {(isVisible || isEnd) && (
                <>
                  {/* META */}
                  {isEnd && !isWall && <div className={styles.endToken} />}

                  {/* ⭐ / ⬜ / • Poderes */}
                  {!isWall &&
                    powerUpsHere.map((pu) => {
                      if (pu.type === "CLEAR_FOG") {
                        // ⬜ cuadrado blanco
                        return (
                          <div key={pu.id} className={styles.powerUpFog} title="Quitar niebla" />
                        )
                      }

                      if (pu.type === "CONFUSION") {
                        // ★ estrella blanca
                        return (
                          <div key={pu.id} className={styles.powerUpConfusion} title="Confusión">
                            ★
                          </div>
                        )
                      }

                      // FREEZE → punto blanco
                      return (
                        <div key={pu.id} className={styles.powerUpFreeze} title="Congelamiento" />
                      )
                    })}

                  {/* Otros jugadores */}
                  {!isWall &&
                    otherPlayersHere.map((player, idx) => (
                      <div
                        key={player.username}
                        className={styles.otherPlayerToken}
                        style={{
                          color: player.avatarColor || "#FF6B6B",
                          transform: `translate(${idx * 4}px, ${idx * 4}px)`,
                          zIndex: 10 + idx,
                        }}
                        title={player.username}
                      />
                    ))}

                  {/* Jugador actual */}
                  {isPlayer && !isWall && (
                    <div
                      className={cn(styles.playerToken, isGameWon && styles.playerTokenWinning)}
                    />
                  )}
                </>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
