/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    host: true,
    port: 3000,
  },
  define: {
    global: "globalThis",
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "src/test/setup.ts",      // Archivo de config de tests
        "src/main.tsx",           // Punto de entrada 
        "src/vite-env.d.ts",      // Tipos de TS
        "**/*.d.ts",              // Definiciones de tipos
        "**/*.test.{ts,tsx}",     // Los propios tests
        "**/*.config.{ts,js}",    // Archivos de configuración
        "**/*.css",               // Estilos globales
        "**/*.module.css",        // Módulos CSS 
      ],

    },

  },
});
