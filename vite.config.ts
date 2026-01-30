import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa.svg'],
      manifest: {
        name: 'Factor APY Screener',
        short_name: 'Factor APY',
        description: 'Liquid glass PWA for wallet APY exposure.',
        theme_color: '#0b0f1a',
        background_color: '#0b0f1a',
        display: 'standalone',
        icons: [
          {
            src: '/pwa.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
