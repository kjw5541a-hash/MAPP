import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://<user>.github.io/MAPP/, so every URL must resolve under
// that subpath. Manifest paths are relative for that reason.
const base = '/MAPP/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'],
      manifest: {
        name: 'Music',
        short_name: 'Music',
        description: 'Local m4a music player',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#e0e5ec',
        theme_color: '#e0e5ec',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
        // Always answer navigations from the precached shell, so a network
        // error page can never replace the running app mid-playback.
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
})
