import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Configuración de Vitest separada de vite.config.ts a propósito: Vitest trae su
// propia copia de Vite y mezclar ambos tipos en un solo archivo rompe `tsc`.
// Este archivo no se incluye en tsconfig (no lo typechequea tsc); Vitest lo lee
// en runtime vía esbuild.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Los tests no dependen de un .env local (que está gitignored): la API se
    // mockea con MSW, pero env.ts exige VITE_API_URL al importarse. Lo fijamos
    // aquí para que la suite corra igual en CI y en local sin .env.
    env: {
      VITE_API_URL: 'http://localhost:8080',
    },
  },
})
