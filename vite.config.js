import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: process.env.PORT || 8080,
    host: '0.0.0.0',
    allowedHosts: ['ready-truck-production.up.railway.app', '.railway.app']
  }
})
