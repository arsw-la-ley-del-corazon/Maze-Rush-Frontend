import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material"
import CelebrationIcon from "@mui/icons-material/Celebration"
import RefreshIcon from "@mui/icons-material/Refresh"

interface WinDialogProps {
  isOpen: boolean
  time: number
  onRestart: () => void
  playerName?: string
}

/**
 * Win Dialog component that displays when a player completes the maze
 * Shows completion time and allows the player to restart
 */
export function WinDialog({ isOpen, time, onRestart, playerName }: WinDialogProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onRestart}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: "linear-gradient(135deg, rgba(164, 106, 255, 0.1), rgba(155, 81, 224, 0.1))",
          backdropFilter: "blur(20px)",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <CelebrationIcon sx={{ fontSize: 32, color: "#A46AFF" }} />
          <Typography variant="h4" component="span" fontWeight={700}>
            ¡Escapaste!
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box textAlign="center" py={2}>
          {playerName && (
            <Typography variant="body1" color="text.secondary" gutterBottom>
              ¡Felicidades, {playerName}!
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" mb={2}>
            Encontraste la salida del laberinto
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Tu tiempo fue:
          </Typography>
          <Typography
            variant="h2"
            component="div"
            fontWeight={700}
            sx={{
              fontFamily: "monospace",
              background: "linear-gradient(135deg, #A46AFF, #C05DFF)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {formatTime(time)}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, justifyContent: "center" }}>
        <Button
          variant="contained"
          onClick={onRestart}
          fullWidth
          size="large"
          startIcon={<RefreshIcon />}
          sx={{
            borderRadius: 999,
            py: 1.5,
            fontWeight: 600,
          }}
        >
          Jugar de Nuevo
        </Button>
      </DialogActions>
    </Dialog>
  )
}
