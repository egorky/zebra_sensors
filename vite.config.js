import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// En desarrollo, Vite corre en modo middleware dentro de `server/index.js` (un solo puerto).
// ZEBRA_* del .env raíz se inyectan en el bundle del cliente (mismas variables que usa Node para el poller).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  return {
    plugins: [react()],
    define: {
      __ZEBRA_BUILD_BASE_URL__: JSON.stringify(String(env.ZEBRA_API_BASE_URL || '').trim()),
      __ZEBRA_BUILD_API_KEY__: JSON.stringify(String(env.ZEBRA_API_KEY || '').trim()),
    },
  };
});
