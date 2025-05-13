
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Define any environment variables that should be available at build time
  define: {
    // Ensure environment variables are properly exposed
    // Empty object as Vite handles import.meta.env automatically
  },
})
