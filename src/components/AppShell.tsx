import { useState, type ReactNode } from "react"
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Divider,
  Tooltip,
  Button,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import DashboardIcon from "@mui/icons-material/SpaceDashboard"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import LogoutIcon from "@mui/icons-material/Logout"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import GroupAddIcon from "@mui/icons-material/GroupAdd"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import SettingsIcon from "@mui/icons-material/Settings"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/useAuth"

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: "Inicio", path: "/app", icon: <DashboardIcon /> },
  { label: "Juego Rápido", path: "/app/quick-play", icon: <PlayArrowIcon /> },
  { label: "Crear Lobby", path: "/app/create-lobby", icon: <GroupAddIcon /> },
  { label: "Perfil", path: "/app/profile", icon: <AccountCircleIcon /> },
  { label: "Leaderboard", path: "/app/leaderboard", icon: <EmojiEventsIcon /> },
  { label: "Configuración", path: "/app/settings", icon: <SettingsIcon /> },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: "rgba(20,11,31,0.7)",
          backdropFilter: "blur(12px) saturate(180%)",
          borderBottom: "1px solid var(--brand-border-translucent)",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
            Maze <Box component="span" sx={{ color: "primary.main" }}>Rush</Box>
          </Typography>
          {user && (
            <Tooltip title={user.email} arrow>
              <Avatar sx={{ bgcolor: user.avatarColor, cursor: "pointer" }} onClick={() => navigate("/app/profile")}> 
                {user.username[0]?.toUpperCase()}
              </Avatar>
            </Tooltip>
          )}
          <Button
            color="inherit"
            onClick={() => {
              logout()
              navigate("/login")
            }}
            startIcon={<LogoutIcon />}
            sx={{ ml: 1, textTransform: "none" }}
          >
            Salir
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            background: "rgba(38,23,62,0.85)",
            backdropFilter: "blur(18px) saturate(180%)",
            borderRight: "1px solid var(--brand-border-translucent)",
            width: 270,
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: user?.avatarColor }}>{user?.username[0]?.toUpperCase()}</Avatar>
          <Box>
            <Typography fontWeight={600}>{user?.username}</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List sx={{ py: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNav(item.path)}
                selected={active}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    background: "linear-gradient(90deg,#321658,#221033)",
                    border: "1px solid var(--brand-border-translucent)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: active ? "primary.main" : "rgba(255,255,255,0.65)" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{ fontWeight: active ? 600 : 500, fontSize: 15 }}
                  primary={item.label}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, pt: 10, px: { xs: 2, md: 4 }, pb: 6 }}>
        {children}
      </Box>
    </Box>
  )
}
