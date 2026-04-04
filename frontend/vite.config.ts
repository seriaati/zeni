import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router-dom)/, priority: 30 },
            { name: 'vendor-charts', test: /node_modules[\\/]recharts/, priority: 20 },
            { name: 'vendor-utils', test: /node_modules[\\/](date-fns|lucide-react|clsx)/, priority: 10 },
          ],
        },
      },
    },
  },
})
