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
 */
export function Maze({ maze, playerPosition, endPosition, isGameWon, otherPlayers = [] }: MazeProps) {
  if (!maze || maze.length === 0) {
    return null
  }

  const width = maze[0].length

  return (
    <div
      className={styles.mazeContainer}
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
      }}
    >
      {maze.map((row, y) =>
        row.map((cell, x) => {
          const isPlayer = playerPosition.x === x && playerPosition.y === y
          const isEnd = endPosition.x === x && endPosition.y === y
          const otherPlayersHere = otherPlayers.filter((p) => p.position.x === x && p.position.y === y)

          return (
            <div
              key={`${y}-${x}`}
              className={cn(
                styles.cell,
                styles.cellWall,
                cell.top && styles.cellWallTop,
                cell.right && styles.cellWallRight,
                cell.bottom && styles.cellWallBottom,
                cell.left && styles.cellWallLeft,
                isEnd && styles.endPosition
              )}
            >
              {isEnd && <div className={styles.endToken} />}
              
              {/* Render other players at this position */}
              {otherPlayersHere.map((player, idx) => (
                <div
                  key={player.username}
                  className={styles.otherPlayerToken}
                  style={{
                    backgroundColor: player.avatarColor || "#FF6B6B",
                    transform: `translate(${idx * 4}px, ${idx * 4}px)`,
                    zIndex: 10 + idx,
                  }}
                  title={player.username}
                />
              ))}
              
              {/* Render current player */}
              {isPlayer && (
                <div className={cn(styles.playerToken, isGameWon && styles.playerTokenWinning)} />
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
