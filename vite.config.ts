import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Habilita acceso desde otros dispositivos en la red local
  server: {
    host: true, // equivalente a 0.0.0.0
    port: 5173,
    // Puedes activar strictPort: true si quieres que falle en lugar de cambiar de puerto
  },
})
