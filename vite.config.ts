import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Use BASE_URL env var for GitHub Pages, default to '/' for local dev
  base: process.env.BASE_URL || '/',
})
