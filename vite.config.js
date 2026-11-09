import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const rootDir = import.meta.dirname

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@/shared': path.resolve(rootDir, './src/shared'),
      '@/microfrontends': path.resolve(rootDir, './src/microfrontends'),
      '@/layouts': path.resolve(rootDir, './src/layouts'),
      '@/views': path.resolve(rootDir, './src/views'),
      '@/mocks': path.resolve(rootDir, './src/mocks'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('vue') ||
              id.includes('vue-router') ||
              id.includes('pinia')
            ) {
              return 'vendor'
            }
            if (id.includes('jspdf')) {
              return 'ui'
            }
          }
        },
      },
    },
  },
})
