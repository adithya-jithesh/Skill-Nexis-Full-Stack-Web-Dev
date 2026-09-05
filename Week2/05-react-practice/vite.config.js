import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Vite understands *.module.css out of the box, so CSS modules need no
// extra config here - the file name is what turns the feature on.
export default defineConfig({
  plugins: [react()],
})
