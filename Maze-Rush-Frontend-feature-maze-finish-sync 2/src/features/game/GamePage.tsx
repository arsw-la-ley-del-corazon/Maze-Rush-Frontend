// src/features/game/GamePage.tsx
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

import Maze from "../../components/Maze" // 👈 asegúrate de que Maze tenga export default
import { WinDialog } from "../../components/WinDialog"
import PowerUpToast from "../../components/PowerUpToast"
import { useAuth } from "../../context/useAuth"
import { useGameSocket, Direction } from "../../context/useGameSocket"
import styles from "./GamePage.module.css"

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // usamos el mismo code como lobbyCode y gameId (ajusta si tu backend separa esto)
  const lobbyCode = code || ""
  const gameId = code || ""
  const username = user?.username ?? ""

  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [winnerTime, setWinnerTime] = useState<number | null>(null)

  const gameStartedRef = useRef(false)
  const winnerSetRef = useRef(false)

  const {
    isConnected,
    disconnect,
    gameState,
    myPlayer,
    isMyPlayerFrozen,
    hasClearFog,
    lastNotification,
    clearNotification,
    sendMove,
  } = useGameSocket({ lobbyCode, gameId })

  // -------- redirección si no hay código ----------
  useEffect(() => {
    if (!code) {
      navigate("/app", { replace: true })
    }
  }, [code, navigate])

  // -------- iniciar timer al recibir el primer estado ----------
  useEffect(() => {
    if (gameState && !gameStartedRef.current) {
      setTimer(0)
      setIsTimerRunning(true)
      setGameOver(false)
      setWinner(null)
      setWinnerTime(null)
      winnerSetRef.current = false
      gameStartedRef.current = true
    }
  }, [gameState])

  // -------- timer MM:SS ----------
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

  // -------- detectar ganador desde gameState ----------
  useEffect(() => {
    if (!gameState || winnerSetRef.current) return

    const finishedPlayers = gameState.players.filter(
      (p) =>
        p.isFinished ||
        (typeof p.finishTime === "number" && p.finishTime > 0),
    )

    if (finishedPlayers.length === 0) return

    const sorted = [...finishedPlayers].sort(
      (a, b) =>
        (a.finishTime ?? Number.MAX_SAFE_INTEGER) -
        (b.finishTime ?? Number.MAX_SAFE_INTEGER),
    )

    const winPlayer = sorted[0]
    if (!winPlayer) return

    winnerSetRef.current = true
    setIsTimerRunning(false)
    setGameOver(true)
    setWinner(winPlayer.username)
    setWinnerTime(winPlayer.finishTime ?? timer)
  }, [gameState, timer])

  // -------- controles de teclado (direction) ----------
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!gameState) return
      if (gameOver) return
      if (isMyPlayerFrozen) return

      let direction: Direction | null = null

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          direction = "UP"
          break
        case "ArrowDown":
        case "s":
        case "S":
          direction = "DOWN"
          break
        case "ArrowLeft":
        case "a":
        case "A":
          direction = "LEFT"
          break
        case "ArrowRight":
        case "d":
        case "D":
          direction = "RIGHT"
          break
        default:
          break
      }

      if (direction) {
        e.preventDefault()
        // CONFUSION lo maneja el backend, aquí no invertimos nada
        sendMove(direction)
      }
    },
    [gameState, gameOver, isMyPlayerFrozen, sendMove],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // -------- salir del juego ----------
  const handleLeaveGame = useCallback(() => {
    try {
      if (isConnected) {
        disconnect()
      }
    } catch (e) {
      console.error("[GamePage] error al desconectar", e)
    } finally {
      navigate("/app", { replace: true })
    }
  }, [isConnected, disconnect, navigate])

  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect()
      }
    }
  }, [isConnected, disconnect])

  // -------- util: formato de tiempo ----------
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // -------- loading inicial (sin gameState) ----------
  if (!gameState) {
    return (
      <Box className={styles.container}>
        <CircularProgress sx={{ color: "#4cffb3" }} />
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

      {/* Maze con poderes */}
      <Box className={styles.mazeContainer}>
        <Maze
          layout={gameState.currentLayout}
          players={gameState.players}
          myUsername={username}
          hasClearFog={hasClearFog}
        />
      </Box>

      {/* Win dialog */}
      <WinDialog
        isOpen={gameOver}
        time={winnerTime ?? timer}
        onRestart={() => {
          // si quieres reiniciar lógica de partida local, resetea flags;
          // el backend debe encargarse de mandar un nuevo estado/layout si hay "replay"
          gameStartedRef.current = false
          winnerSetRef.current = false
          setGameOver(false)
          setTimer(0)
          setIsTimerRunning(true)
          setWinner(null)
          setWinnerTime(null)
        }}
        playerName={winner ?? user?.username}
      />

      {/* Toast de Power-Ups */}
      <PowerUpToast notification={lastNotification} onClose={clearNotification} />
    </Box>
  )
}
