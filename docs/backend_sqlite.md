# Backend SQLite (API Node)

Toda la configuración del API está en el archivo **`.env` en la raíz del repositorio** (no uses `server/.env`). El proceso carga ese archivo mediante `server/loadRootEnv.js`.

## Puerto del backend

| Variable (raíz `.env`) | Descripción |
|----------------------|-------------|
| **`BACKEND_PORT`** | Puerto HTTP del API Express (por defecto **3001** en código). |

**No uses la variable `PORT` del `.env` para el API:** en este proyecto `PORT` está reservada para el servidor **Vite** que sirve la SPA compilada (`npm start` / `npm run preview`).

El cliente debe declarar la misma base en **`VITE_BACKEND_URL`**, por ejemplo:

```dotenv
BACKEND_PORT=3001
VITE_BACKEND_URL=http://localhost:3001
```

## Otros valores del API (mismo `.env` raíz)

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Firma de JWT (mínimo 16 caracteres). |
| `DATABASE_PATH` | Ruta al SQLite (por defecto `./server/data/app.db` relativo a la raíz del repo). |
| `CORS_ORIGIN` | Uno o varios orígenes separados por coma. Por defecto el código asume `http://localhost:5173` y `http://localhost:4173` (dev y preview del front). |
| `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` | Primer administrador si la base está vacía (por defecto `admin` / `changeme`). Debe cambiar la contraseña al primer login. |

## Arranque conjunto con el front

No hace falta un comando aparte para el backend:

- **`npm run dev`** — levanta Vite (hot reload) y el API en paralelo (`concurrently`).
- **`npm start`** — ejecuta el build y luego Vite preview + API en paralelo.

Variables que usa solo el front en Vite:

- **`DEV_HOST` / `DEV_PORT`** — servidor de desarrollo (`npm run dev`).
- **`HOST` / `PORT`** — servidor que sirve `dist/` cuando ejecutas el preview integrado en `npm start`.
- **`ALLOWED_HOSTS`** — opcional, para el preview de Vite.

## CLI seed

Desde la raíz del repo:

```bash
npm run seed -- nuevo_usuario su_clave admin
```

Usa el mismo `.env` y `DATABASE_PATH`.

## Referencia de APIs Zebra

La configuración de Zebra Data Services en el navegador sigue siendo independiente; véase [api_configuration.md](api_configuration.md).
