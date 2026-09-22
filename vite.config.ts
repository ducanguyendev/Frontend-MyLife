import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 7000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5274',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

