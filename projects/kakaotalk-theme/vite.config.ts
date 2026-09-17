import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Published alongside the player at https://<user>.github.io/MAPP/kakao/, so
// this build's assets must resolve under that subpath.
export default defineConfig({
  base: '/MAPP/kakao/',
  plugins: [react(), tailwindcss()],
})
