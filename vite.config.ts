import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    // The app must open instantly. Keep the shell in one chunk.
    rollupOptions: { output: { manualChunks: undefined } },
  },
})
