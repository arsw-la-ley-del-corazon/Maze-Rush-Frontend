
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material"
import HomePage from "./features/home/HomePage"
import LoginPage from "./features/login/LoginPage"
import SignUpPage from "./features/singup/SignUpPage"
import ForgotPasswordPage from './features/forgot/ForgotPasswordPage'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#38f2a4' },
    secondary: { main: '#4fb3ff' },
    background: { default: '#0d1f2e', paper: '#102838' },
    success: { main: '#48d43c' },
    info: { main: '#4fb3ff' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, Roboto, Arial, sans-serif'
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 }
      }
    }
  }
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
