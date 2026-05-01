import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite corre en modo middleware dentro de `server/index.js` (un solo puerto).
export default defineConfig({
  plugins: [react()],
});
