import { Box, Typography, Chip, Avatar, Stack, IconButton } from "@mui/material"
import PlayCircleIcon from "@mui/icons-material/PlayCircle"
import GroupAddIcon from "@mui/icons-material/GroupAdd"
import KeyIcon from "@mui/icons-material/VpnKey"
import PersonIcon from "@mui/icons-material/Person"
import LockIcon from "@mui/icons-material/Lock"
import PublicIcon from "@mui/icons-material/Public"
import RefreshIcon from "@mui/icons-material/Refresh"
import styles from "./DashboardPage.module.css"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/useAuth"
import { useState } from "react"

interface Room {
  id: string
  name: string
  host: string
  players: number
  maxPlayers: number
  isPrivate: boolean
  status: "waiting" | "playing" | "full"
  code?: string
}

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  color: string
}

function QuickAction({ icon, label, onClick, color }: QuickActionProps) {
  return (
    <div className={styles.quickAction} onClick={onClick} data-color={color}>
      <div className={styles.quickActionIcon}>{icon}</div>
      <Typography variant="body2" className={styles.quickActionLabel}>
        {label}
      </Typography>
    </div>
  )
}

interface RoomCardProps {
  room: Room
  onClick: () => void
}

function RoomCard({ room, onClick }: RoomCardProps) {
  const statusColors = {
    waiting: "success",
    playing: "warning",
    full: "error",
  } as const

  const statusText = {
    waiting: "ESPERANDO",
    playing: "EN JUEGO",
    full: "LLENA",
  }

  return (
    <div className={styles.roomCard} onClick={onClick} data-status={room.status}>
      <div className={styles.roomHeader}>
        <div className={styles.roomInfo}>
          <Typography variant="h6" className={styles.roomName}>
            {room.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
              {room.host[0].toUpperCase()}
            </Avatar>
            <Typography variant="caption" className={styles.roomHost}>
              {room.host}
            </Typography>
          </Stack>
        </div>
        <div className={styles.roomBadge}>
          {room.isPrivate ? <LockIcon sx={{ fontSize: 20 }} /> : <PublicIcon sx={{ fontSize: 20 }} />}
        </div>
      </div>

      <div className={styles.roomFooter}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2" className={styles.roomPlayers}>
            {room.players}/{room.maxPlayers}
          </Typography>
        </Stack>
        <Chip
          label={statusText[room.status]}
          color={statusColors[room.status]}
          size="small"
          className={styles.statusChip}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Datos simulados de salas (TODO: conectar con WebSocket/API)
  const [rooms] = useState<Room[]>([
    {
      id: "1",
      name: "Sala Épica de Alex",
      host: "Alex",
      players: 3,
      maxPlayers: 4,
      isPrivate: false,
      status: "waiting",
    },
    {
      id: "2",
      name: "Desafío Extremo",
      host: "Luna",
      players: 2,
      maxPlayers: 6,
      isPrivate: false,
      status: "waiting",
    },
    {
      id: "3",
      name: "Solo Pros 🔥",
      host: "Shadow",
      players: 4,
      maxPlayers: 4,
      isPrivate: true,
      status: "full",
      code: "ABC123",
    },
    {
      id: "4",
      name: "Carrera Nocturna",
      host: "Night",
      players: 2,
      maxPlayers: 8,
      isPrivate: false,
      status: "playing",
    },
    {
      id: "5",
      name: "Modo Casual",
      host: "Chill",
      players: 1,
      maxPlayers: 4,
      isPrivate: false,
      status: "waiting",
    },
  ])

  const handleRefreshRooms = () => {
    // TODO: Actualizar salas desde el servidor
    console.log("Refrescando salas...")
  }

  const handleJoinRoom = (room: Room) => {
    if (room.status === "waiting" && room.players < room.maxPlayers) {
      navigate(`/app/lobby/${room.id}`)
    }
  }

  return (
    <Box className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <Typography variant="h3" fontWeight={900} className={styles.mainTitle}>
          MAZE RUSH
        </Typography>
        <Typography variant="h6" className={styles.welcomeText}>
          ¡Hola {user?.username}! 🎮
        </Typography>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <QuickAction
          icon={<PlayCircleIcon sx={{ fontSize: 32 }} />}
          label="QUICK PLAY"
          onClick={() => navigate("/app/quick-play")}
          color="red"
        />
        <QuickAction
          icon={<GroupAddIcon sx={{ fontSize: 32 }} />}
          label="CREAR SALA"
          onClick={() => navigate("/app/create-lobby")}
          color="blue"
        />
        <QuickAction
          icon={<KeyIcon sx={{ fontSize: 32 }} />}
          label="UNIRSE"
          onClick={() => navigate("/app/join")}
          color="green"
        />
      </div>

      {/* Rooms Section */}
      <div className={styles.roomsSection}>
        <div className={styles.roomsHeader}>
          <Typography variant="h5" className={styles.sectionTitle}>
            🎯 SALAS DISPONIBLES
          </Typography>
          <IconButton onClick={handleRefreshRooms} className={styles.refreshButton}>
            <RefreshIcon />
          </IconButton>
        </div>

        {rooms.length === 0 ? (
          <div className={styles.emptyState}>
            <Typography variant="h6" className={styles.emptyText}>
              No hay salas disponibles 😔
            </Typography>
            <Typography variant="body2" className={styles.emptySubtext}>
              ¡Sé el primero en crear una!
            </Typography>
          </div>
        ) : (
          <div className={styles.roomsGrid}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onClick={() => handleJoinRoom(room)} />
            ))}
          </div>
        )}
      </div>
    </Box>
  )
}
