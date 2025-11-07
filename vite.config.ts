
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Sentry plugin for uploading source maps (only in production builds with auth token)
    mode === 'production' && process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT || "pt2030-candidaturas",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      sourcemaps: {
        assets: './dist/**',
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080
  },
  // Define environment variables for build time and runtime
  define: {
    // Ensure environment variables are properly exposed
  },
  // Add optimizations for production build
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable source maps for Sentry
    minify: 'terser',
    target: 'es2018',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  }
}));
