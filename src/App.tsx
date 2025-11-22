import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material"
import "./global.css"
import HomePage from "./features/home/HomePage"
import LoginPage from "./features/login/LoginPage"
import { AuthProvider } from "./context/AuthContext"
import { useAuth } from "./context/useAuth"
import AppShell from "./components/AppShell"
import DashboardPage from "./features/dashboard/DashboardPage"
import ProfilePage from "./features/profile/ProfilePage"
import { SocketProvider } from "./context/SocketContext"
import QuickPlayPage from "./features/quickplay/QuickPlayPage"

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#A46AFF" },
    secondary: { main: "#9B51E0" },
    background: { default: "#140B1F", paper: "#26173E" },
    info: { main: "#C05DFF" },
    success: { main: "#B675FF" },
    warning: { main: "#C889FF" },
  },
  typography: {
    fontFamily: "Inter, system-ui, Roboto, Arial, sans-serif",
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 999,
        },
        containedPrimary: {
          background: "var(--gradient-button-primary)",
          boxShadow:
            "0 4px 14px -2px rgba(76,111,255,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset",
          transition: "var(--transition-base)",
          "&:hover": {
            background: "var(--gradient-button-primary-hover)",
            boxShadow:
              "0 8px 20px -4px rgba(76,111,255,0.6), 0 0 0 1px rgba(255,255,255,0.18) inset",
          },
        },
        outlinedSecondary: {
          background: "var(--gradient-button-secondary)",
          border: "1px solid var(--brand-border-translucent)",
          "&:hover": {
            background: "var(--gradient-button-secondary-hover)",
            borderColor: "var(--brand-border-strong)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "var(--brand-panel-bg)",
          backdropFilter: "blur(14px) saturate(160%)",
          border: "1px solid var(--brand-border-translucent)",
        },
      },
    },
  },
})

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Público */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* Autenticado */}
            <Route
              path="/app"
              element={
                <Protected>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </Protected>
              }
            />
            <Route
              path="/app/profile"
              element={
                <Protected>
                  <AppShell>
                    <ProfilePage />
                  </AppShell>
                </Protected>
              }
            />
            <Route
              path="/app/quick-play"
              element={
                <Protected>
                  <AppShell>
                    <QuickPlayPage />
                  </AppShell>
                </Protected>
              }
            />
            {/* Placeholders futuros */}
            <Route
              path="/app/:stub"
              element={
                <Protected>
                  <AppShell>
                    <div style={{ padding: 24 }}>
                      <h2>En construcción</h2>
                      <p>Esta sección estará disponible próximamente.</p>
                    </div>
                  </AppShell>
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
