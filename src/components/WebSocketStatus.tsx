// Componente opcional para mostrar el estado de conexión WebSocket
// Se puede agregar al Dashboard si se desea feedback visual de la conexión

import { Box, Chip } from "@mui/material"
import WifiIcon from "@mui/icons-material/Wifi"
import WifiOffIcon from "@mui/icons-material/WifiOff"
import { useState, useEffect } from "react"

interface WebSocketStatusProps {
  isConnected: boolean
}

export function WebSocketStatus({ isConnected }: WebSocketStatusProps) {
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Mostrar el status solo si hay cambios en la conexión
    setShowStatus(true)
    const timer = setTimeout(() => setShowStatus(false), 3000)
    return () => clearTimeout(timer)
  }, [isConnected])

  if (!showStatus) return null

  return (
    <Box
      sx={{
        position: "fixed",
        top: 80,
        right: 20,
        zIndex: 9999,
        animation: "slideIn 0.3s ease",
      }}
    >
      <Chip
        icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
        label={isConnected ? "Conectado" : "Desconectado"}
        color={isConnected ? "success" : "error"}
        sx={{
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      />
    </Box>
  )
}
