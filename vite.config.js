import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-netlify-toml',
      closeBundle() {
        copyFileSync('netlify.toml', 'dist/netlify.toml');
      },
    },
  ],
});
