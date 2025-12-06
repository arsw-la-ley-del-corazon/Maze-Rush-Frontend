/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],

    // Path aliases para imports más limpios
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@components": resolve(__dirname, "./src/components"),
        "@features": resolve(__dirname, "./src/features"),
        "@hooks": resolve(__dirname, "./src/hooks"),
        "@context": resolve(__dirname, "./src/context"),
        "@lib": resolve(__dirname, "./src/lib"),
        "@common": resolve(__dirname, "./src/common"),
        "@types": resolve(__dirname, "./src/types"),
        "@assets": resolve(__dirname, "./src/assets"),
      },
    },

    // Base URL para el despliegue
    base: "/",

    // Configuración del servidor de desarrollo
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      open: false,
      cors: true,
      // Proxy para el backend (opcional, descomentar si es necesario)
      // proxy: {
      //   '/api': {
      //     target: env.VITE_API_BASE_URL || 'http://localhost:8080',
      //     changeOrigin: true,
      //     secure: false,
      //   },
      // },
    },

    // Configuración del servidor de preview
    preview: {
      host: true,
      port: 3000,
      strictPort: true,
    },

    // Variables globales
    define: {
      global: "globalThis",
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
      __DEV__: !isProduction,
    },

    // Configuración de build
    build: {
      outDir: "dist",
      sourcemap: isProduction ? "hidden" : true,
      minify: isProduction ? "esbuild" : false,
      target: "es2022",
      cssTarget: "chrome100",
      // Reportar tamaño de chunks
      reportCompressedSize: true,
      // Límite de advertencia para chunks grandes (500kb)
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          // Nombres de archivos con hash para cache busting
          entryFileNames: "assets/js/[name]-[hash].js",
          chunkFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || "";
            if (/\.(gif|jpe?g|png|svg|webp|ico)$/.test(info)) {
              return "assets/images/[name]-[hash][extname]";
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(info)) {
              return "assets/fonts/[name]-[hash][extname]";
            }
            if (/\.css$/.test(info)) {
              return "assets/css/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
          // Code splitting manual para mejor caching
          manualChunks: {
            // Vendor chunks para librerías principales
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-mui": ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
            "vendor-ws": ["@stomp/stompjs", "sockjs-client"],
            "vendor-utils": ["axios", "uuid", "styled-components"],
          },
        },
      },
    },

    // Optimizaciones de dependencias
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@mui/material",
        "@emotion/react",
        "@emotion/styled",
        "axios",
      ],
      exclude: ["@vitest/ui"],
    },

    // Configuración de CSS
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: "camelCase",
        generateScopedName: isProduction
          ? "[hash:base64:8]"
          : "[name]__[local]__[hash:base64:5]",
      },
    },

    // Configuración de esbuild
    esbuild: {
      // Eliminar console.log y debugger en producción
      drop: isProduction ? ["console", "debugger"] : [],
      legalComments: "none",
    },

    // Configuración de tests con Vitest
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
      // Timeout para tests
      testTimeout: 10000,
      // Modo de aislamiento
      isolate: true,
      // Pool de threads
      pool: "threads",
      // Reporteros
      reporters: ["verbose"],
      // Configuración de coverage
      coverage: {
        provider: "v8",
        reporter: ["text", "text-summary", "html", "json", "lcov", "clover"],
        reportsDirectory: "./coverage",
        // Umbrales de cobertura (descomentar para forzar mínimos)
        // thresholds: {
        //   lines: 70,
        //   functions: 70,
        //   branches: 70,
        //   statements: 70,
        // },
        exclude: [
          "node_modules/",
          "src/test/**",
          "src/main.tsx",
          "src/vite-env.d.ts",
          "**/*.d.ts",
          "**/*.test.{ts,tsx}",
          "**/*.spec.{ts,tsx}",
          "**/*.config.{ts,js,mjs}",
          "**/*.css",
          "**/*.module.css",
          "**/index.ts",
          "coverage/**",
          "dist/**",
        ],
      },
    },
  };
});
