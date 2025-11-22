import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Box, Typography, Button, Paper, Avatar, CircularProgress, IconButton, Chip } from "@mui/material"
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import TimerIcon from "@mui/icons-material/Timer"
import ExitToAppIcon from "@mui/icons-material/ExitToApp"
import { Maze } from "../../components/Maze"
import { WinDialog } from "../../components/WinDialog"
import { useAuth } from "../../context/useAuth"
import { useGameSocket } from "../../context/useGameSocket"
import type { PlayerGameState } from "../../types/api"
import { generateMazeFromBackend, convertLayoutToCells, type MazeCell } from "./services/mazeService"
import styles from "./GamePage.module.css"

/**
 * GamePage - Main game component for Maze Rush
 * Handles maze generation, player movement, timer, and multiplayer state
 */
export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [maze, setMaze] = useState<MazeCell[][] | null>(null)
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 })
  const [endPosition, setEndPosition] = useState({ x: 19, y: 19 })
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mazeSize] = useState("MEDIUM") // SMALL, MEDIUM, LARGE - Por ahora hardcodeado, luego vendrá del lobby
  const [otherPlayers, setOtherPlayers] = useState<PlayerGameState[]>([])
  const [mazeError, setMazeError] = useState<string | null>(null)

  const gameStartedRef = useRef(false)
  const lastMoveTimeRef = useRef(0)

  // Game socket for multiplayer synchronization
  const { isConnected, sendMove, sendFinish, disconnect: disconnectGame } = useGameSocket({
    lobbyCode: code || "",
    onPlayerMove: (username, position) => {
      setOtherPlayers((prev) => {
        const updated = prev.map((p) => (p.username === username ? { ...p, position } : p))
        if (!updated.find((p) => p.username === username)) {
          updated.push({
            username,
            position,
            isFinished: false,
            avatarColor: generatePlayerColor(username),
          })
        }
        return updated
      })
    },
    onPlayerFinish: (username, finishTime) => {
      setOtherPlayers((prev) =>
        prev.map((p) => (p.username === username ? { ...p, isFinished: true, finishTime } : p))
      )
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
      setOtherPlayers(
        players
          .filter((p) => p.username !== user?.username)
          .map((p) => ({ ...p, avatarColor: p.avatarColor || generatePlayerColor(p.username) }))
      )
    },
  })

  /**
   * Generate a consistent color for each player based on their username
   */
  const generatePlayerColor = (username: string) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE"]
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * Initialize maze from backend
   */
  const initializeMaze = useCallback(async () => {
    setIsLoading(true)
    setMazeError(null)
    
    const result = await generateMazeFromBackend(mazeSize)
    
    if (!result.ok) {
      setMazeError(result.error.message)
      setIsLoading(false)
      return
    }

    const { layout, startX, startY, goalX, goalY } = result.data
    const mazeCells = convertLayoutToCells(layout)
    
    setMaze(mazeCells)
    setPlayerPosition({ x: startX, y: startY })
    setEndPosition({ x: goalX, y: goalY })
    setTimer(0)
    setIsTimerRunning(true)
    setGameWon(false)
    setIsLoading(false)
    gameStartedRef.current = true
  }, [mazeSize])

  useEffect(() => {
    if (!code) {
      navigate("/app")
      return
    }

    initializeMaze()
  }, [code, navigate, initializeMaze])

  /**
   * Timer effect
   */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  /**
   * Check for win condition
   */
  useEffect(() => {
    if (
      !isLoading &&
      gameStartedRef.current &&
      playerPosition.x === endPosition.x &&
      playerPosition.y === endPosition.y
    ) {
      setIsTimerRunning(false)
      setGameWon(true)
      sendFinish(timer)
    }
  }, [playerPosition, endPosition, isLoading, timer, sendFinish])

  /**
   * Player movement logic with WebSocket synchronization
   */
  const movePlayer = useCallback(
    (direction: "Up" | "Down" | "Left" | "Right") => {
      if (!maze || gameWon || isLoading) return

      setPlayerPosition((prev) => {
        const { x, y } = prev
        let newPos = { ...prev }

        if (direction === "Up" && y > 0 && !maze[y][x].top) {
          newPos = { x, y: y - 1 }
        } else if (direction === "Down" && y < maze.length - 1 && !maze[y][x].bottom) {
          newPos = { x, y: y + 1 }
        } else if (direction === "Left" && x > 0 && !maze[y][x].left) {
          newPos = { x: x - 1, y }
        } else if (direction === "Right" && x < maze[0].length - 1 && !maze[y][x].right) {
          newPos = { x: x + 1, y }
        }

        // Send move to server (with throttling)
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
    [maze, gameWon, isLoading, sendMove]
  )

  /**
   * Keyboard controls
   */
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
        movePlayer(direction as "Up" | "Down" | "Left" | "Right")
      }
    },
    [movePlayer]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  /**
   * Handle leaving the game
   */
  const handleLeaveGame = () => {
    if (isConnected) {
      disconnectGame()
    }
    navigate("/app")
  }

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

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
            label={formatTime(timer)}
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

      {/* Maze Container */}
      <Box className={styles.mazeContainer}>
        {maze && (
          <Maze
            maze={maze}
            playerPosition={playerPosition}
            endPosition={endPosition}
            isGameWon={gameWon}
            otherPlayers={otherPlayers}
          />
        )}
      </Box>

      {/* Mobile Controls */}
      <Box className={styles.mobileControls}>
        <Box className={styles.controlGrid}>
          <div />
          <IconButton onClick={() => movePlayer("Up")} disabled={isLoading || gameWon} size="large">
            <ArrowUpwardIcon fontSize="large" />
          </IconButton>
          <div />
          <IconButton onClick={() => movePlayer("Left")} disabled={isLoading || gameWon} size="large">
            <ArrowBackIcon fontSize="large" />
          </IconButton>
          <IconButton onClick={() => movePlayer("Down")} disabled={isLoading || gameWon} size="large">
            <ArrowDownwardIcon fontSize="large" />
          </IconButton>
          <IconButton onClick={() => movePlayer("Right")} disabled={isLoading || gameWon} size="large">
            <ArrowForwardIcon fontSize="large" />
          </IconButton>
        </Box>
      </Box>

      {/* Win Dialog */}
      <WinDialog
        isOpen={gameWon}
        time={timer}
        onRestart={() => {
          initializeMaze()
        }}
        playerName={user?.username}
      />
    </Box>
  )
}
