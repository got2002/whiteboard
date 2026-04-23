import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true, // เปิดให้เข้าถึงจาก network (ไม่ใช่แค่ localhost)
  },
})
