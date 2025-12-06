import ExitToAppIcon from "@mui/icons-material/ExitToApp"
import TimerIcon from "@mui/icons-material/Timer"
import { Avatar, Box, Button, Chip, CircularProgress, Paper, Typography } from "@mui/material"
// src/features/game/GamePage.tsx
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Maze } from "../../components/Maze"
import { WinDialog } from "../../components/WinDialog"
import { useAuth } from "../../context/useAuth"
import { useGameSocket } from "../../context/useGameSocket"
import type { PlayerGameState } from "../../types/api"
import styles from "./GamePage.module.css"
import {
  type MazeCell,
  convertLayoutToCells,
  generateMazeFromBackend,
} from "./services/mazeService"

// === Tipos locales para poderes (solo front) ===
type PowerUpType = "CLEAR_FOG" | "FREEZE" | "CONFUSION"

interface PowerUpInstance {
  id: string
  x: number
  y: number
  type: PowerUpType
}

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [maze, setMaze] = useState<MazeCell[][] | null>(null)
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 })
  const [endPosition, setEndPosition] = useState({ x: 19, y: 19 })

  // ⏱ tiempo de partida
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [mazeSize] = useState("MEDIUM")
  const [otherPlayers, setOtherPlayers] = useState<PlayerGameState[]>([])
  const [mazeError, setMazeError] = useState<string | null>(null)

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [winnerTime, setWinnerTime] = useState<number | null>(null)

  const gameStartedRef = useRef(false)
  const lastMoveTimeRef = useRef(0)
  const gameFinishedRef = useRef(false)
  const timerRef = useRef(0)

  // 🎮 estados de poderes (efectos en este jugador)
  const [hasClearFog, setHasClearFog] = useState(false)
  const [isFrozen, setIsFrozen] = useState(false)
  const [isConfused, setIsConfused] = useState(false)

  // ⚡ poderes colocados en el laberinto
  const [powerUps, setPowerUps] = useState<PowerUpInstance[]>([])

  // ---------- helpers ----------

  const generatePlayerColor = (username: string) => {
    const colors = [
      "#22D3EE", // cyan
      "#A855F7", // violeta
      "#FB7185", // rosado
      "#F97316", // naranja
      "#4ADE80", // verde
      "#38BDF8", // azul claro
    ]
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * Cerrar la partida en esta pantalla (se ejecuta una sola vez).
   */
  const endGame = useCallback((winnerName: string | null, finalTime?: number) => {
    if (gameFinishedRef.current) return
    gameFinishedRef.current = true

    const timeToUse = typeof finalTime === "number" && finalTime > 0 ? finalTime : timerRef.current

    setIsTimerRunning(false)
    setGameOver(true)
    setWinner(winnerName)
    setWinnerTime(timeToUse)
  }, [])

  /**
   * Genera posiciones aleatorias para los poderes dentro del laberinto:
   * - 1 CLEAR_FOG
   * - 1 FREEZE
   * - 2 o 3 CONFUSION
   */
  const generateRandomPowerUpsForMaze = useCallback(
    (
      mazeCells: MazeCell[][],
      startX: number,
      startY: number,
      goalX: number,
      goalY: number
    ): PowerUpInstance[] => {
      const height = mazeCells.length
      const width = mazeCells[0].length

      type Coord = { x: number; y: number }
      const validCells: Coord[] = []

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const cell = mazeCells[y][x]
          const isWall = cell.top && cell.right && cell.bottom && cell.left

          // Solo caminos, no muros, no start, no meta
          if (!isWall && !(x === startX && y === startY) && !(x === goalX && y === goalY)) {
            validCells.push({ x, y })
          }
        }
      }

      if (validCells.length === 0) return []

      // Mezclar celdas
      validCells.sort(() => Math.random() - 0.5)

      const confusionCount = 2 + Math.floor(Math.random() * 2) // 2 o 3
      const totalNeeded = 1 + 1 + confusionCount // CLEAR_FOG + FREEZE + CONFUSION

      const total = Math.min(totalNeeded, validCells.length)
      const result: PowerUpInstance[] = []

      let idx = 0

      if (idx < total) {
        const { x, y } = validCells[idx++]
        result.push({
          id: `fog-${Date.now()}-${idx}`,
          x,
          y,
          type: "CLEAR_FOG",
        })
      }

      if (idx < total) {
        const { x, y } = validCells[idx++]
        result.push({
          id: `freeze-${Date.now()}-${idx}`,
          x,
          y,
          type: "FREEZE",
        })
      }

      for (let c = 0; c < confusionCount && idx < total; c++) {
        const { x, y } = validCells[idx++]
        result.push({
          id: `conf-${Date.now()}-${idx}-${c}`,
          x,
          y,
          type: "CONFUSION",
        })
      }

      return result
    },
    []
  )

  /**
   * Aplica el efecto del poder recogido.
   */
  const applyPowerUpEffect = useCallback((pu: PowerUpInstance) => {
    if (pu.type === "CLEAR_FOG") {
      setHasClearFog(true)
      setTimeout(() => setHasClearFog(false), 10_000) // 10s
      return
    }

    if (pu.type === "FREEZE") {
      setIsFrozen(true)
      setTimeout(() => setIsFrozen(false), 5_000) // 5s
      return
    }

    if (pu.type === "CONFUSION") {
      setIsConfused(true)
      setTimeout(() => setIsConfused(false), 5_000) // 5s
    }
  }, [])

  // ---------- WebSocket / estado multiplayer ----------

  const {
    isConnected,
    sendMove,
    sendFinish,
    disconnect: disconnectGame,
  } = useGameSocket({
    lobbyCode: code || "",
    onPlayerMove: (username, position) => {
      if (username === user?.username) return

      setOtherPlayers((prev) => {
        const existing = prev.find((p) => p.username === username)
        if (existing) {
          return prev.map((p) => (p.username === username ? { ...p, position } : p))
        }
        return [
          ...prev,
          {
            username,
            position,
            isFinished: false,
            avatarColor: generatePlayerColor(username),
          },
        ]
      })
    },
    onPlayerFinish: (username, finishTimeFromServer) => {
      setOtherPlayers((prev) =>
        prev.map((p) =>
          p.username === username ? { ...p, isFinished: true, finishTime: finishTimeFromServer } : p
        )
      )

      endGame(username, finishTimeFromServer)
    },
    onPlayerJoined: (username) => {
      if (username === user?.username) return

      setOtherPlayers((prev) => {
        if (prev.find((p) => p.username === username)) return prev
        return [
          ...prev,
          {
            username,
            position: { x: 0, y: 0 },
            isFinished: false,
            avatarColor: generatePlayerColor(username),
          },
        ]
      })
    },
    onPlayerLeft: (username) => {
      setOtherPlayers((prev) => prev.filter((p) => p.username !== username))
    },
    onGameSync: (players) => {
      setOtherPlayers(
        players
          .filter((p) => p.username !== user?.username)
          .map((p) => ({
            ...p,
            avatarColor: p.avatarColor || generatePlayerColor(p.username),
          }))
      )

      const finishedPlayer = players.find(
        (p) => p.isFinished || (typeof p.finishTime === "number" && p.finishTime > 0)
      )

      if (finishedPlayer) {
        endGame(finishedPlayer.username, finishedPlayer.finishTime)
      }
    },
  })

  // ---------- carga de laberinto ----------

  const initializeMaze = useCallback(async () => {
    setIsLoading(true)
    setMazeError(null)

    // Reset estado de partida
    setGameOver(false)
    setWinner(null)
    setWinnerTime(null)
    setTimer(0)
    timerRef.current = 0
    setIsTimerRunning(false)
    gameStartedRef.current = false
    gameFinishedRef.current = false

    // Reset efectos y poderes
    setHasClearFog(false)
    setIsFrozen(false)
    setIsConfused(false)
    setPowerUps([])

    const sharedMazeKey = `maze_${code}`
    const sharedMazeData = sessionStorage.getItem(sharedMazeKey)

    let mazeData

    if (sharedMazeData) {
      console.log("Usando laberinto compartido para lobby:", code)
      try {
        const parsedMaze = JSON.parse(sharedMazeData)
        const layout =
          typeof parsedMaze.layout === "string" ? JSON.parse(parsedMaze.layout) : parsedMaze.layout

        mazeData = {
          layout,
          startX: parsedMaze.startX,
          startY: parsedMaze.startY,
          goalX: parsedMaze.goalX,
          goalY: parsedMaze.goalY,
          width: parsedMaze.width,
          height: parsedMaze.height,
        }
      } catch (err) {
        console.error("Error parseando laberinto compartido:", err)
        setMazeError("Error cargando laberinto compartido")
        setIsLoading(false)
        return
      }
    } else {
      console.log("No se encontró laberinto compartido, generando nuevo:", mazeSize)
      const result = await generateMazeFromBackend(mazeSize)

      if (!result.ok) {
        console.error("Failed to generate maze:", result.error)
        setMazeError(result.error.message)
        setIsLoading(false)
        return
      }

      mazeData = result.data
    }

    const { layout, startX, startY, goalX, goalY } = mazeData

    const mazeCells = convertLayoutToCells(layout)
    setMaze(mazeCells)
    setPlayerPosition({ x: startX, y: startY })
    setEndPosition({ x: goalX, y: goalY })

    // Generar poderes aleatorios para esta partida
    const generatedPowerUps = generateRandomPowerUpsForMaze(mazeCells, startX, startY, goalX, goalY)
    setPowerUps(generatedPowerUps)

    setTimer(0)
    timerRef.current = 0
    setIsTimerRunning(true)

    setIsLoading(false)
    gameStartedRef.current = true
  }, [code, mazeSize, generateRandomPowerUpsForMaze])

  useEffect(() => {
    if (!code) {
      navigate("/app")
      return
    }
    initializeMaze()
  }, [code, navigate, initializeMaze])

  // ---------- Timer sincronizado (simple) ----------

  useEffect(() => {
    let interval: number | undefined

    if (isTimerRunning && !gameOver) {
      interval = window.setInterval(() => {
        setTimer((prev) => {
          const next = prev + 1
          timerRef.current = next
          return next
        })
      }, 1000)
    }

    return () => {
      if (interval) window.clearInterval(interval)
    }
  }, [isTimerRunning, gameOver])

  // ---------- Condición de victoria LOCAL ----------

  useEffect(() => {
    if (
      !isLoading &&
      !gameOver &&
      gameStartedRef.current &&
      playerPosition.x === endPosition.x &&
      playerPosition.y === endPosition.y
    ) {
      console.log("[GamePage] ¡Has llegado a la meta! Enviando finish al backend...")

      const myTime = timerRef.current
      sendFinish(myTime)
      endGame(user?.username ?? null, myTime)
    }
  }, [playerPosition, endPosition, isLoading, gameOver, sendFinish, endGame, user?.username])

  // ---------- Movimiento del jugador + recogida de poderes ----------

  const movePlayer = useCallback(
    (direction: "Up" | "Down" | "Left" | "Right") => {
      if (!maze || gameOver || isLoading) return

      const { x, y } = playerPosition
      let newPos = { x, y }

      if (direction === "Up" && y > 0 && !maze[y][x].top) {
        const destCell = maze[y - 1][x]
        const isDestWall = destCell.top && destCell.right && destCell.bottom && destCell.left
        if (!isDestWall) newPos = { x, y: y - 1 }
      } else if (direction === "Down" && y < maze.length - 1 && !maze[y][x].bottom) {
        const destCell = maze[y + 1][x]
        const isDestWall = destCell.top && destCell.right && destCell.bottom && destCell.left
        if (!isDestWall) newPos = { x, y: y + 1 }
      } else if (direction === "Left" && x > 0 && !maze[y][x].left) {
        const destCell = maze[y][x - 1]
        const isDestWall = destCell.top && destCell.right && destCell.bottom && destCell.left
        if (!isDestWall) newPos = { x: x - 1, y }
      } else if (direction === "Right" && x < maze[0].length - 1 && !maze[y][x].right) {
        const destCell = maze[y][x + 1]
        const isDestWall = destCell.top && destCell.right && destCell.bottom && destCell.left
        if (!isDestWall) newPos = { x: x + 1, y }
      }

      if (newPos.x === x && newPos.y === y) {
        return
      }

      const now = Date.now()
      if (now - lastMoveTimeRef.current > 100) {
        sendMove(newPos)
        lastMoveTimeRef.current = now
      }

      setPlayerPosition(newPos)

      // 💥 revisar si hay un power-up en la nueva posición
      setPowerUps((prev) => {
        const found = prev.find((p) => p.x === newPos.x && p.y === newPos.y)
        if (!found) return prev

        applyPowerUpEffect(found)
        return prev.filter((p) => p.id !== found.id)
      })
    },
    [maze, gameOver, isLoading, playerPosition, sendMove, applyPowerUpEffect]
  )

  // ---------- Controles de teclado + confusión / freeze ----------

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver || isLoading) return
      if (isFrozen) return

      const keyMap = {
        ArrowUp: "Up",
        ArrowDown: "Down",
        ArrowLeft: "Left",
        ArrowRight: "Right",
        w: "Up",
        s: "Down",
        a: "Left",
        d: "Right",
        W: "Up",
        S: "Down",
        A: "Left",
        D: "Right",
      } as const

      let direction = keyMap[e.key as keyof typeof keyMap]

      if (!direction) return

      e.preventDefault()

      // Si estoy confundido, invertimos los controles
      if (isConfused) {
        if (direction === "Up") direction = "Down"
        else if (direction === "Down") direction = "Up"
        else if (direction === "Left") direction = "Right"
        else if (direction === "Right") direction = "Left"
      }

      movePlayer(direction)
    },
    [gameOver, isLoading, isFrozen, isConfused, movePlayer]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // ---------- Salir del juego ----------

  const handleLeaveGame = useCallback(() => {
    try {
      if (isConnected) {
        disconnectGame()
      }
    } catch (e) {
      console.error("Error disconnecting socket", e)
    } finally {
      navigate("/app", { replace: true })
    }
  }, [isConnected, disconnectGame, navigate])

  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectGame()
      }
    }
  }, [isConnected, disconnectGame])

  // ---------- formato de tiempo ----------

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // ---------- render ----------

  if (isLoading) {
    return (
      <Box className={styles.container}>
        <CircularProgress sx={{ color: "#4cffb3" }} />
      </Box>
    )
  }

  if (mazeError) {
    return (
      <Box className={styles.container}>
        <Paper className={styles.errorContainer} sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error al cargar el laberinto
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {mazeError}
          </Typography>
          <Button variant="contained" onClick={() => initializeMaze()}>
            Reintentar
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box className={styles.container}>
      {/* Header */}
      <Paper className={styles.header}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              bgcolor: user?.avatarColor || "#A46AFF",
              width: 40,
              height: 40,
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            {user?.username}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            label={isConnected ? "Conectado" : "Desconectado"}
            color={isConnected ? "success" : "error"}
            size="small"
            sx={{ fontSize: "0.75rem" }}
          />
          <Chip
            icon={<TimerIcon />}
            label={formatTime(winnerTime ?? timer)}
            sx={{
              fontSize: "1.1rem",
              fontFamily: "monospace",
              fontWeight: 700,
              bgcolor: "rgba(76, 255, 179, 0.15)",
              color: "#4cffb3",
            }}
          />
          <Button
            variant="outlined"
            onClick={handleLeaveGame}
            startIcon={<ExitToAppIcon />}
            sx={{ borderRadius: 999 }}
          >
            Salir
          </Button>
        </Box>
      </Paper>

      {/* Maze */}
      <Box className={styles.mazeContainer}>
        {maze && (
          <Maze
            maze={maze}
            playerPosition={playerPosition}
            endPosition={endPosition}
            isGameWon={gameOver}
            otherPlayers={otherPlayers}
            hasClearFog={hasClearFog}
            powerUps={powerUps}
          />
        )}
      </Box>

      {/* Win dialog */}
      <WinDialog
        isOpen={gameOver}
        time={winnerTime ?? timer}
        onRestart={() => {
          initializeMaze()
        }}
        playerName={winner ?? user?.username}
      />
    </Box>
  )
}
