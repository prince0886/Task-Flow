import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Task-Flow/' : '/',  // Solves localhost white screen while maintaining GH Pages path
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
