
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material"
import HomePage from "./features/home/HomePage"
import LoginPage from "./features/login"

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#ff9800' },
    background: { default: '#f5f6fa', paper: '#fff' },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
