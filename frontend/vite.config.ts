import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Set base path for GH Pages builds; '/' for local dev
  base: command === 'build' ? '/ca-doughnut/' : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
}))
