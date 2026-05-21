import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup-app.html'),
        options: resolve(__dirname, 'src/options-app.html'),
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
