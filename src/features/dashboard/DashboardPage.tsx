import { 
  Box, Typography, Paper, Button, IconButton, CircularProgress, Alert,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Pagination, Chip
} from "@mui/material"
import PlayCircleIcon from "@mui/icons-material/PlayCircle"
import GroupAddIcon from "@mui/icons-material/GroupAdd"
import KeyIcon from "@mui/icons-material/VpnKey"
import RefreshIcon from "@mui/icons-material/Refresh"
import LockIcon from "@mui/icons-material/Lock"
import PeopleIcon from "@mui/icons-material/People"
import SearchIcon from "@mui/icons-material/Search"
import FilterListIcon from "@mui/icons-material/FilterList"
import styles from "./DashboardPage.module.css"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "../../context/useAuth"
import { getAllLobbies, joinLobby } from "../lobby/services/lobbyService"
import type { LobbyResponse } from "../../types/api"
import { useRoomUpdates } from "../../hooks/useRoomUpdates"

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <Button
      variant="contained"
      className={styles.actionButton}
      onClick={onClick}
      startIcon={icon}
      fullWidth
    >
      {label}
    </Button>
  )
}

interface RoomCardProps {
  roomName: string
  host: string
  players: number
  maxPlayers: number
  isPrivate: boolean
  mazeSize?: string
  status?: string
  onJoin: () => void
}

function RoomCard({ roomName, host, players, maxPlayers, isPrivate, mazeSize, status, onJoin }: RoomCardProps) {
  const isWaiting = status === "waiting" || status === "WAITING" || status === "EN_ESPERA"
  const canJoin = isWaiting && players < maxPlayers
  
  return (
    <Paper 
      elevation={0} 
      className={`${styles.roomCard} ${canJoin ? styles.roomCardClickable : ''}`}
      onClick={canJoin ? onJoin : undefined}
      sx={{ 
        cursor: canJoin ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': canJoin ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        } : {}
      }}
    >
      <Box className={styles.roomHeader}>
        <Box className={styles.roomInfo}>
          <Typography variant="h6" fontWeight={600} className={styles.roomName}>
            {roomName}
          </Typography>
          <Box className={styles.roomMeta}>
            <PeopleIcon sx={{ fontSize: 16, opacity: 0.7 }} />
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {host}
            </Typography>
          </Box>
          {mazeSize && (
            <Typography variant="caption" sx={{ opacity: 0.5, display: "block", mt: 0.5 }}>
              Tamaño: {mazeSize}
            </Typography>
          )}
        </Box>
        {isPrivate && (
          <LockIcon className={styles.lockIcon} />
        )}
      </Box>
      <Box className={styles.roomFooter}>
        <Box className={styles.playerCount}>
          <PeopleIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600}>
            {players}/{maxPlayers}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          className={styles.joinButton}
          onClick={(e) => {
            e.stopPropagation()
            onJoin()
          }}
          disabled={!canJoin}
        >
          {!isWaiting ? "EN JUEGO" : canJoin ? "UNIRME" : "LLENA"}
        </Button>
      </Box>
    </Paper>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [availableRooms, setAvailableRooms] = useState<LobbyResponse[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [mazeSizeFilter, setMazeSizeFilter] = useState("all")
  const [playersFilter, setPlayersFilter] = useState("all")
  
  const [currentPage, setCurrentPage] = useState(1)
  const roomsPerPage = 6
  
  const roomUpdates = useRoomUpdates()

  const fetchAvailableRooms = useCallback(async () => {
    setLoadingRooms(true)
    setError(null)
    try {
      const result = await getAllLobbies()
      console.log("📡 Respuesta del backend:", result)
      
      if (result.ok) {
        console.log("✅ Total de salas recibidas:", result.data.length)
        console.log("📋 Salas completas:", result.data)
        
        const publicRooms = result.data.filter(lobby => 
          lobby.isPublic && (lobby.status === "EN_ESPERA" || lobby.status === "WAITING" || lobby.status === "waiting")
        )
        console.log("🌍 Salas públicas en espera:", publicRooms.length)
        console.log("📊 Salas públicas:", publicRooms)
        
        setAvailableRooms(publicRooms)
      } else {
        console.error("❌ Error del backend:", result.error)
        setError(result.error.message)
      }
    } catch (err) {
      console.error("💥 Error capturado:", err)
      setError("Error al cargar las salas disponibles")
    } finally {
      setLoadingRooms(false)
    }
  }, [])
  
  useEffect(() => {
    const updateTimer = setTimeout(() => {
      const recentUpdates = Object.values(roomUpdates).filter(
        update => Date.now() - update.lastUpdate < 2000
      )
      
      if (recentUpdates.length > 0) {
        console.log("🔄 Actualizaciones recientes detectadas, recargando salas...")
        fetchAvailableRooms()
      }
    }, 500)

    return () => clearTimeout(updateTimer)
  }, [roomUpdates, fetchAvailableRooms])
  
  const filteredRooms = useMemo(() => {
    console.log("🔄 Aplicando filtros...")
    console.log("   - Total de salas:", availableRooms.length)
    console.log("   - Búsqueda:", searchQuery)
    console.log("   - Filtro tamaño:", mazeSizeFilter)
    console.log("   - Filtro jugadores:", playersFilter)
    
    let filtered = [...availableRooms]
    
    if (searchQuery) {
      filtered = filtered.filter(room => 
        room.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase())
      )
      console.log("   ✓ Después de búsqueda:", filtered.length)
    }
    
    if (mazeSizeFilter !== "all") {
      filtered = filtered.filter(room => room.mazeSize === mazeSizeFilter)
      console.log("   ✓ Después de filtro tamaño:", filtered.length)
    }
    
    if (playersFilter !== "all") {
      filtered = filtered.filter(room => {
        switch (playersFilter) {
          case "1-2": return room.maxPlayers >= 1 && room.maxPlayers <= 2
          case "3-4": return room.maxPlayers >= 3 && room.maxPlayers <= 4
          case "5+": return room.maxPlayers >= 5
          default: return true
        }
      })
      console.log("   ✓ Después de filtro jugadores:", filtered.length)
    }
    
    console.log("✅ Salas filtradas final:", filtered.length)
    return filtered
  }, [availableRooms, searchQuery, mazeSizeFilter, playersFilter])
  
  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * roomsPerPage
    const endIndex = startIndex + roomsPerPage
    const paginated = filteredRooms.slice(startIndex, endIndex)
    console.log("📄 Paginación:")
    console.log("   - Página actual:", currentPage)
    console.log("   - Inicio:", startIndex, "Fin:", endIndex)
    console.log("   - Salas en esta página:", paginated.length)
    return paginated
  }, [filteredRooms, currentPage, roomsPerPage])
  
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage)
  
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const handleClearFilters = () => {
    setSearchQuery("")
    setMazeSizeFilter("all")
    setPlayersFilter("all")
    setCurrentPage(1)
  }

  const handleRefreshRooms = () => {
    console.log("🔄 Refrescando salas manualmente...")
    fetchAvailableRooms()
  }

  const handleJoinRoom = async (code: string) => {
    try {
      console.log("🎮 Uniéndose a la sala:", code)
      const result = await joinLobby(code)
      
      if (result.ok) {
        console.log("✅ Unido exitosamente al lobby:", result.data.code)
        navigate(`/app/lobby/${result.data.code}`)
      } else {
        console.error("❌ Error al unirse:", result.error)
        setError(result.error.message || "Error al unirse a la sala")
      }
    } catch (err) {
      console.error("❌ Error inesperado:", err)
      setError("Error al intentar unirse a la sala")
    }
  }

  useEffect(() => {
    fetchAvailableRooms()
  }, [fetchAvailableRooms])

  return (
    <Box className={styles.container}>
      {/* Hero Section */}
      <Box className={styles.hero}>
        <Typography variant="h2" className={styles.mainTitle}>
          MAZE RUSH
        </Typography>
        <Typography variant="h6" className={styles.subtitle}>
          ¡Hola {user?.username || "jugador"}!
        </Typography>
        {user && (user.level || user.score !== undefined) && (
          <Box className={styles.userStats}>
            {user.level && (
              <Box className={styles.statBadge}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Nivel
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {user.level}
                </Typography>
              </Box>
            )}
            {user.score !== undefined && (
              <Box className={styles.statBadge}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Puntos
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {user.score}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      <Box className={styles.actionsGrid}>
        <ActionButton
          icon={<PlayCircleIcon sx={{ fontSize: 24 }} />}
          label="QUICK PLAY"
          onClick={() => navigate("/app/quick-play")}
        />
        <ActionButton
          icon={<GroupAddIcon sx={{ fontSize: 24 }} />}
          label="CREAR SALA"
          onClick={() => navigate("/app/create-lobby")}
        />
        <ActionButton
          icon={<KeyIcon sx={{ fontSize: 24 }} />}
          label="UNIRSE"
          onClick={() => navigate("/app/join")}
        />
      </Box>

      {/* Search and Filters Section */}
      <Box className={styles.filtersSection}>
        <Box className={styles.searchBar}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre de creador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "rgba(76, 255, 179, 0.5)" }} />
                </InputAdornment>
              ),
            }}
            className={styles.searchInput}
          />
        </Box>

        <Box className={styles.filtersBar}>
          <Box className={styles.filterControls}>
            <FormControl size="small" className={styles.filterSelect}>
              <InputLabel>Tamaño de Laberinto</InputLabel>
              <Select
                value={mazeSizeFilter}
                label="Tamaño de Laberinto"
                onChange={(e) => setMazeSizeFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="small">Pequeño</MenuItem>
                <MenuItem value="medium">Mediano</MenuItem>
                <MenuItem value="large">Grande</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" className={styles.filterSelect}>
              <InputLabel>Jugadores Máx.</InputLabel>
              <Select
                value={playersFilter}
                label="Jugadores Máx."
                onChange={(e) => setPlayersFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="1-2">1-2 Jugadores</MenuItem>
                <MenuItem value="3-4">3-4 Jugadores</MenuItem>
              </Select>
            </FormControl>

            {(searchQuery || mazeSizeFilter !== "all" || playersFilter !== "all") && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearFilters}
                className={styles.clearFiltersBtn}
              >
                Limpiar Filtros
              </Button>
            )}
          </Box>

          <Box className={styles.resultsInfo}>
            <Chip 
              icon={<FilterListIcon />}
              label={`${filteredRooms.length} sala${filteredRooms.length !== 1 ? 's' : ''} encontrada${filteredRooms.length !== 1 ? 's' : ''}`}
              className={styles.resultsChip}
            />
          </Box>
        </Box>
      </Box>

      {/* Available Rooms Section */}
      <Box className={styles.roomsSection}>
        <Box className={styles.sectionHeader}>
          <Box className={styles.sectionTitleWrapper}>
            <Box className={styles.sectionIndicator} />
            <Typography variant="h6" className={styles.sectionTitle}>
              SALAS DISPONIBLES
              {/*
              <Chip 
                label="ACTUALIZACIÓN EN VIVO"
                size="small"
                sx={{ 
                  ml: 2, 
                  backgroundColor: "rgba(76, 255, 179, 0.1)", 
                  color: "#4cffb3",
                  border: "1px solid rgba(76, 255, 179, 0.3)",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  animation: "pulse 2s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.6 }
                  }
                }}
              />
              */}
            </Typography>
          </Box>
          <IconButton 
            onClick={handleRefreshRooms}
            className={styles.refreshButton}
            size="small"
            disabled={loadingRooms}
            title="Actualizar manualmente"
          >
            <RefreshIcon className={loadingRooms ? styles.spinning : ""} />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingRooms ? (
          <Box className={styles.loadingState}>
            <CircularProgress size={40} sx={{ color: "#4cffb3" }} />
            <Typography variant="body1" sx={{ mt: 2, opacity: 0.7 }}>
              Cargando salas disponibles...
            </Typography>
          </Box>
        ) : (
          <>
            <Box className={styles.roomsGrid}>
              {paginatedRooms.map((room) => {
                const currentPlayers = room.currentPlayers ?? roomUpdates[room.code]?.playerCount ?? 0
                const roomStatus = roomUpdates[room.code]?.status || room.status
                
                console.log(`🎮 Sala ${room.code}:`, {
                  currentPlayers,
                  fromBackend: room.currentPlayers,
                  fromWebSocket: roomUpdates[room.code]?.playerCount,
                  status: roomStatus
                })
                
                return (
                  <RoomCard
                    key={room.id}
                    roomName={`Sala de ${room.creatorUsername}`}
                    host={room.creatorUsername}
                    players={currentPlayers}
                    maxPlayers={room.maxPlayers}
                    isPrivate={!room.isPublic}
                    mazeSize={room.mazeSize}
                    status={roomStatus}
                    onJoin={() => handleJoinRoom(room.code)}
                  />
                )
              })}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box className={styles.paginationContainer}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  className={styles.pagination}
                />
              </Box>
            )}

            {!loadingRooms && filteredRooms.length === 0 && (
              <Box className={styles.emptyState}>
                {searchQuery || mazeSizeFilter !== "all" || playersFilter !== "all" ? (
                  <>
                    <Typography variant="body1" sx={{ opacity: 0.5 }}>
                      No se encontraron salas con los filtros aplicados
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.4, mt: 1 }}>
                      Intenta ajustar los filtros o crear una nueva sala
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ opacity: 0.5 }}>
                      No hay salas públicas disponibles en este momento
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.4, mt: 1 }}>
                      ¡Crea una nueva sala o únete con un código!
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
