import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
// El host/puerto del dev server se pasan por CLI (ver script "dev") y el polling
// para HMR en Docker se activa con CHOKIDAR_USEPOLLING=true (docker-compose).
// La configuración de Vitest vive en vitest.config.ts (evita el choque de tipos
// entre Vite 8 y la copia de Vite que trae Vitest).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
