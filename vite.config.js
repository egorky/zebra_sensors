import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno del archivo .env
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      // Usa el puerto de la variable de entorno PORT o el puerto 5173 por defecto
      port: env.PORT || 5173,
      // Usa el host de la variable de entorno HOST o 'localhost' por defecto
      // Para exponer en todas las IPs, establece HOST=0.0.0.0 en tu .env
      host: env.HOST || 'localhost',
    },
    preview: {
      // Servidor de producción local / PM2 (`npm start`). Configurable con PREVIEW_HOST y PREVIEW_PORT en `.env`.
      host: env.PREVIEW_HOST || '0.0.0.0',
      port: Number(env.PREVIEW_PORT || 4173),
      strictPort: true,
      allowedHosts: env.PREVIEW_ALLOWED_HOSTS
        ? env.PREVIEW_ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean)
        : true,
    },
  }
})
