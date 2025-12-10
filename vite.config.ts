import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Usamos './' para que sea relativo.
  // Esto hace que el sitio funcione sin importar cómo se llame el repositorio
  // (Igual que en Better-roblox-ui)
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});