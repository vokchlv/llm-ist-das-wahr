import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        background: 'src/background.js',
        popup: 'src/popup-app.html',
        options: 'src/options-app.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      }
    }
  },
  server: {
    port: 5173
  }
})
