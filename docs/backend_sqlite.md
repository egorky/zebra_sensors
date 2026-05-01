# Backend SQLite (API Node)

Toda la configuración está en el **`.env` en la raíz del repositorio**. El proceso carga ese archivo mediante `server/loadRootEnv.js`.

El API se expone en el **mismo servidor HTTP** que la SPA, bajo el prefijo **`/api`**. No hace falta un segundo puerto ni CORS para el uso normal (mismo origen).

## Puerto y host

Un solo proceso escucha en **`HOST`** y **`PORT`** (variables del `.env` raíz). El mismo valor usa el navegador para la web y para las peticiones a `/api/...` si no defines `VITE_BACKEND_URL`.

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto HTTP (por defecto **5173** en desarrollo, **4173** en producción si no está definido). |
| `HOST` | Interfaz de escucha (por defecto **`0.0.0.0`**). |

Con **`npm run dev`**, `NODE_ENV` no es `production` y Vite corre en modo middleware dentro de Express.

Con **`npm start`**, `NODE_ENV=production` y Express sirve los estáticos de `dist/` además del API.

## Variables del API (mismo `.env`)

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Firma de JWT (mínimo 16 caracteres). |
| `DATABASE_PATH` | Ruta al SQLite (por defecto `./server/data/app.db` relativo a la raíz del repo). |
| `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` | Primer administrador si la base está vacía (por defecto `admin` / `changeme`). Hay que cambiar la contraseña al primer login. |

## Cliente: `VITE_BACKEND_URL`

- **Vacío o sin definir:** el front llama a rutas relativas (`/api/...`) en el mismo host y puerto (recomendado).
- **URL absoluta:** solo si despliegas el front en otro dominio que el API.

## CLI seed

Desde la raíz del repo:

```bash
npm run seed -- nuevo_usuario su_clave admin
```

Usa el mismo `.env` y `DATABASE_PATH`.

## Referencia de APIs Zebra

La configuración de Zebra Data Services en el navegador es independiente; véase [api_configuration.md](api_configuration.md).
