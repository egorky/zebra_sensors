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
      host: '0.0.0.0',
      port: 4173,
      allowedHosts: ['telecomvas-bulk.ioos.app']
    }
  }
})
