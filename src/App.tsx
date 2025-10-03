import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material"
import "./global.css"
import HomePage from "./features/home/HomePage"
import LoginPage from "./features/login/LoginPage"
import SignUpPage from "./features/singup/SignUpPage"
import ForgotPasswordPage from "./features/forgot/ForgotPasswordPage"

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#4C6FFF" },
    secondary: { main: "#9B51E0" },
    background: { default: "#0B1020", paper: "#161C30" },
    info: { main: "#3E9BFF" },
    success: { main: "#6D5BFF" },
    warning: { main: "#B675FF" },
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
          boxShadow: "0 4px 14px -2px rgba(76,111,255,0.55), 0 0 0 1px rgba(255,255,255,0.12) inset",
          transition: "var(--transition-base)",
          '&:hover': {
            background: "var(--gradient-button-primary-hover)",
            boxShadow: "0 8px 20px -4px rgba(76,111,255,0.6), 0 0 0 1px rgba(255,255,255,0.18) inset",
          },
        },
        outlinedSecondary: {
          background: "var(--gradient-button-secondary)",
          border: "1px solid var(--brand-border-translucent)",
          '&:hover': {
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
