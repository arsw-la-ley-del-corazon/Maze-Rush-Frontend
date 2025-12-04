import { Snackbar, Alert } from "@mui/material"
import type { PowerUpNotification } from "../types/powerUps"

interface PowerUpToastProps {
  notification: PowerUpNotification | null
  onClose: () => void
}

export default function PowerUpToast({ notification, onClose }: PowerUpToastProps) {
  const open = Boolean(notification)

  if (!notification) return null

  const { message, powerUpType } = notification

  // Color según tipo de poder
  const severity =
    powerUpType === "FREEZE"
      ? "info"
      : powerUpType === "CONFUSION"
      ? "warning"
      : "success" // CLEAR_FOG

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  )
}
