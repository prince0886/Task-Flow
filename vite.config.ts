import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/TaskFlow/',  // <---- MUST BE YOUR EXACT GITHUB REPO NAME, surrounded by slashes
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
