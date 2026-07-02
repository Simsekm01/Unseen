import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// HTTPS hinweis: getUserMedia (Kamera) braucht https oder localhost.
// Lokal laeuft alles ueber localhost -> passt. Beim Deploy unbedingt https.
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
  },
})
