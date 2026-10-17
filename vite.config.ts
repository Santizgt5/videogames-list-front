import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Las llamadas a /api van al backend, así no hay problemas de CORS en desarrollo
    proxy: { "/api": "http://localhost:3000" },
  },
});
