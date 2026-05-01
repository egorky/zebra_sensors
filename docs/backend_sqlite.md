# Backend SQLite (API Node)

Variables en **`server/.env`** (plantilla: `server/.env.example`).

## Puerto del backend

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto HTTP del API Express (por defecto **3001** en código). |

El front debe declarar la misma base en **`VITE_BACKEND_URL`** del `.env` de la raíz del repo, por ejemplo:

```dotenv
VITE_BACKEND_URL=http://localhost:3001
```

Si cambias `PORT` en el servidor, actualiza también `VITE_BACKEND_URL` y recompila el front (`npm run build` o `npm run dev`).

## Primer usuario y cambio obligatorio de contraseña

Si la tabla de usuarios está **vacía** al arrancar el servidor, se inserta un administrador según:

| Variable | Si no existe |
|----------|----------------|
| `BOOTSTRAP_ADMIN_USERNAME` | `admin` |
| `BOOTSTRAP_ADMIN_PASSWORD` | `changeme` |

Ese usuario queda con **`must_change_password = 1`**: la SPA solo muestra la pantalla **Cambiar contraseña** hasta completar un cambio (nueva clave mínimo 8 caracteres). Luego se emite un JWT nuevo y el uso es normal.

**Producción:** define `BOOTSTRAP_ADMIN_PASSWORD` robusto **antes** del primer arranque, rota `JWT_SECRET`, y ajusta `CORS_ORIGIN` al origen real del front.

## Otras variables del servidor

- **`JWT_SECRET`** — firma de JWT (mínimo 16 caracteres en validación del proceso).
- **`DATABASE_PATH`** — ruta al fichero SQLite (por defecto `server/data/app.db`).
- **`CORS_ORIGIN`** — origen del navegador permitido (esquema + host + puerto), p. ej. `http://localhost:5173` en desarrollo.

## Variables del `.env` en la raíz (solo front / Vite)

| Variable | Uso |
|----------|-----|
| **`VITE_BACKEND_URL`** | Obligatoria: URL base del API Node para login y rutas `/api/*`. |
| **`DEV_HOST`**, **`DEV_PORT`** | Servidor de desarrollo Vite (`npm run dev`). Por defecto `localhost` y `5173`. |
| **`HOST`**, **`PORT`** | Servidor que sirve la carpeta **`dist/`** con `vite preview` (`npm start`, `npm run preview`). Por defecto `0.0.0.0` y `4173`. |
| **`ALLOWED_HOSTS`** | Opcional: lista separada por comas para la opción `allowedHosts` del preview de Vite. |

El API Node usa **su propio** `PORT` en `server/.env`; no confundir con el `PORT` del `.env` raíz, que controla el puerto del **servidor estático** del front compilado.
