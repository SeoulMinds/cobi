import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    hmr: true,
    watch: {
      usePolling: false
    }
  },
  optimizeDeps: {
    include: ['react-router', 'react-router-dom']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
