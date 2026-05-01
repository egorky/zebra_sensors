import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Desarrollo con hot reload (`npm run dev`)
    server: {
      port: Number(env.DEV_PORT || 5173),
      host: env.DEV_HOST || 'localhost',
    },
    // Servidor estático que sirve `dist/` (`npm run preview`, `npm start`)
    preview: {
      host: env.HOST || '0.0.0.0',
      port: Number(env.PORT || 4173),
      strictPort: true,
      allowedHosts: env.ALLOWED_HOSTS
        ? env.ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
        : true,
    },
  };
});
