import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' uses relative asset paths — works when served from any subdirectory,
// including GitHub Pages project pages (e.g. https://user.github.io/repo/).
export default defineConfig({
  plugins: [react()],
  base: './',
})
