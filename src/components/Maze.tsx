// src/components/Maze.tsx
import React from "react"
import styles from "./Maze.module.css"
import { PlayerState } from "../types/powerUps"

interface MazeProps {
  layout: string          // string del backend (con 0,1,F,P, etc.)
  players: PlayerState[]  // jugadores con posición y efectos
  myUsername: string
  hasClearFog: boolean    // efecto CLEAR_FOG
}

const Maze: React.FC<MazeProps> = ({
  layout,
  players,
  myUsername,
  hasClearFog,
}) => {
  // Cada fila del layout es una línea del string
  const rows = layout.trim().split("\n")

  // Todos los jugadores en una celda (soporta varios)
  const getPlayersAt = (x: number, y: number) =>
    players.filter((p) => p.position.x === x && p.position.y === y)

  return (
    <div className={styles.mazeWrapper}>
      {/* 🌫 Niebla global: si NO tengo CLEAR_FOG, mostramos overlay */}
      {!hasClearFog && <div className={styles.fogOverlay} />}

      <div className={styles.mazeGrid}>
        {rows.map((row, y) =>
          row.split("").map((cell, x) => {
            const cellKey = `${x}-${y}`
            const playersHere = getPlayersAt(x, y)

            // Clases base de celda
            let cellClass = styles.cell
            if (cell === "1") cellClass += ` ${styles.wall}`
            if (cell === "0") cellClass += ` ${styles.path}`
            if (cell === "F") cellClass += ` ${styles.finish}`

            const hasPowerUp = cell === "P"

            return (
              <div key={cellKey} className={cellClass}>
                {/* 🎁 Caja sorpresa / Power-Up */}
                {hasPowerUp && (
                  <div className={styles.powerUpBox}>
                    🎁
                  </div>
                )}

                {/* 👥 Jugadores en esta celda */}
                {playersHere.map((player, idx) => (
                  <div
                    key={player.username}
                    className={[
                      styles.playerAvatar,
                      player.username === myUsername ? styles.playerAvatarMe : "",
                      player.activeEffects?.FREEZE ? styles.playerFrozen : "",
                      player.activeEffects?.CONFUSION ? styles.playerConfused : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      zIndex: 10 + idx,
                      transform: `translate(${idx * 4}px, ${idx * 4}px)`,
                    }}
                  >
                    <span className={styles.playerInitials}>
                      {player.username[0]?.toUpperCase()}
                    </span>

                    {/* Badges mini con efectos */}
                    <div className={styles.effectsBadges}>
                      {player.activeEffects?.FREEZE && (
                        <span className={styles.effectBadge}>❄️</span>
                      )}
                      {player.activeEffects?.CONFUSION && (
                        <span className={styles.effectBadge}>❓</span>
                      )}
                      {player.activeEffects?.CLEAR_FOG && (
                        <span className={styles.effectBadge}>🔦</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}

export default Maze
