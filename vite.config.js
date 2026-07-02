import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

<<<<<<< HEAD
// HTTPS hinweis: getUserMedia (Kamera) braucht https oder localhost.
// Lokal laeuft alles ueber localhost -> passt. Beim Deploy unbedingt https.
=======
>>>>>>> cef553901371bf220774623f8c092096541acc20
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
  },
})
