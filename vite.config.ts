import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/", // 👈 importante
  resolve: {
    alias: {
      "@common": path.resolve(__dirname, "./src/common"),
      "@context": path.resolve(__dirname, "./src/context"),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    host: true,
    port: 3000,
  },
});
