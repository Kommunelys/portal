import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // hCaptcha virker ikke på localhost. Lokalt brukes lokal.kommunelys.no,
  // som peker til 127.0.0.1 (DNS hos Domeneshop).
  server: { allowedHosts: ['lokal.kommunelys.no'] },
})
