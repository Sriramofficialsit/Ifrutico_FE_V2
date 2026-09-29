import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  server: {
    // Mirrors the production nginx rule: /api/* -> Express with the /api prefix stripped
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom/client', 'react-router-dom', 'react-helmet', 'react-helmet-async',
      'framer-motion', 'lucide-react', 'react-hot-toast', 'react-fast-marquee',
      'gsap', 'gsap/ScrollTrigger', 'lenis', 'ogl', 'chart.js', 'react-chartjs-2', 'dompurify',
    ],
  },
  esbuild: {
    pure: ['console.log', 'console.debug'],
    drop: ['debugger'],
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(three|@react-three|meshline|gl-matrix)\//.test(id)) return 'three'
          if (/node_modules\/(gsap|@gsap|lenis)\//.test(id)) return 'gsap'
          if (/node_modules\/(chart\.js|react-chartjs-2)\//.test(id)) return 'charts'
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
        },
      },
    },
  },
})
