import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  Chip,
} from "@mui/material"
import TimerIcon from "@mui/icons-material/Timer"
import ExitToAppIcon from "@mui/icons-material/ExitToApp"

import { Maze } from "../../components/Maze"
import { WinDialog } from "../../components/WinDialog"
import { useAuth } from "../../context/useAuth"
import { useGameSocket } from "../../context/useGameSocket"
import type { PlayerGameState } from "../../types/api"
import {
  generateMazeFromBackend,
  convertLayoutToCells,
  type MazeCell,
} from "./services/mazeService"
import styles from "./GamePage.module.css"

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [maze, setMaze] = useState<MazeCell[][] | null>(null)
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 })
  const [endPosition, setEndPosition] = useState({ x: 19, y: 19 })

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
  const gameFinishedRef = useRef(false) // <- NUEVO: para no cerrar el juego 2 veces

  // ---------- helpers ----------
  const generatePlayerColor = (username: string) => {
    const colors = ["#F7FF3C", "#22D3EE", "#A855F7", "#FB7185", "#98D8C8", "#F7DC6F"]
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * Cierra la partida en ESTA PANTALLA.
   * Se asegura de ejecutarse solo una vez usando gameFinishedRef.
   */
  const endGame = useCallback(
    (winnerName: string | null, finalTime: number) => {
      if (gameFinishedRef.current) {
        // Ya se había cerrado esta partida
        return
      }
      gameFinishedRef.current = true
      console.log("[GamePage] endGame => winner:", winnerName, "time:", finalTime)

      setIsTimerRunning(false)
      setGameOver(true)
      setWinner(winnerName)
      setWinnerTime(finalTime)
    },
    [],
  )

  // ---------- WebSocket / estado multiplayer ----------
  const { isConnected, sendMove, sendFinish, disconnect: disconnectGame } = useGameSocket({
    lobbyCode: code || "",
    onPlayerMove: (username, position) => {
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
    onPlayerFinish: (username, finishTime) => {
      console.log("[GamePage] onPlayerFinish (socket):", username, finishTime)

      // Marcar al jugador como terminado en la lista local
      setOtherPlayers((prev) =>
        prev.map((p) =>
          p.username === username ? { ...p, isFinished: true, finishTime } : p,
        ),
      )

      // Cerrar partida para TODOS (incluido el ganador)
      endGame(username, finishTime)
    },
    onPlayerJoined: (username) => {
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
      console.log("[GamePage] onGameSync:", players)

      // Actualizar jugadores remotos
      setOtherPlayers(
        players
          .filter((p) => p.username !== user?.username)
          .map((p) => ({
            ...p,
            avatarColor: p.avatarColor || generatePlayerColor(p.username),
          })),
      )

      // Buscar si ya hay un jugador terminado
      const finishedPlayer = players.find(
        (p) =>
          p.isFinished ||
          (typeof p.finishTime === "number" && p.finishTime > 0),
      )

      if (finishedPlayer && typeof finishedPlayer.finishTime === "number") {
        // Cerrar partida usando la información del sync
        endGame(finishedPlayer.username, finishedPlayer.finishTime)
      }
    },
  })

  // ---------- carga de laberinto ----------
  const initializeMaze = useCallback(async () => {
    setIsLoading(true)
    setMazeError(null)

    // Reset de estado de partida
    setGameOver(false)
    setWinner(null)
    setWinnerTime(null)
    setTimer(0)
    setIsTimerRunning(false)
    gameStartedRef.current = false
    gameFinishedRef.current = false

    const sharedMazeKey = `maze_${code}`
    const sharedMazeData = sessionStorage.getItem(sharedMazeKey)

    let mazeData

    if (sharedMazeData) {
      console.log("Usando laberinto compartido para lobby:", code)
      try {
        const parsedMaze = JSON.parse(sharedMazeData)
        const layout =
          typeof parsedMaze.layout === "string"
            ? JSON.parse(parsedMaze.layout)
            : parsedMaze.layout

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

    setTimer(0)
    setIsTimerRunning(true)
    setIsLoading(false)
    gameStartedRef.current = true
  }, [code, mazeSize])

  useEffect(() => {
    if (!code) {
      navigate("/app")
      return
    }
    initializeMaze()
  }, [code, navigate, initializeMaze])

  // ---------- Timer ----------
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    if (isTimerRunning && !gameOver) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
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

      // 1) Avisar al backend
      sendFinish(timer)

      // 2) Cerrar partida localmente de inmediato
      endGame(user?.username ?? null, timer)
    }
  }, [playerPosition, endPosition, isLoading, gameOver, timer, sendFinish, endGame, user?.username])

  // ---------- Movimiento del jugador ----------
  const movePlayer = useCallback(
    (direction: "Up" | "Down" | "Left" | "Right") => {
      if (!maze || gameOver || isLoading) return

      setPlayerPosition((prev) => {
        const { x, y } = prev
        let newPos = { ...prev }

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

        if (newPos.x !== prev.x || newPos.y !== prev.y) {
          const now = Date.now()
          if (now - lastMoveTimeRef.current > 100) {
            sendMove(newPos)
            lastMoveTimeRef.current = now
          }
        }

        return newPos
      })
    },
    [maze, gameOver, isLoading, sendMove],
  )

  // ---------- Controles de teclado ----------
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyMap = {
        ArrowUp: "Up",
        ArrowDown: "Down",
        ArrowLeft: "Left",
        ArrowRight: "Right",
        w: "Up",
        s: "Down",
        a: "Left",
        d: "Right",
      } as const

      const direction = keyMap[e.key as keyof typeof keyMap]

      if (direction) {
        e.preventDefault()
        movePlayer(direction)
      }
    },
    [movePlayer],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // ---------- Salir del juego ----------
  const handleLeaveGame = useCallback(() => {
    console.log("[GamePage] Leaving game...")
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

  // ---------- util: formato de tiempo ----------
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
