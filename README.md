# Zebra Sensor Manager

Interfaz web para gestionar sensores electrónicos de temperatura **Zebra** mediante las APIs de Management y Data Reporting de Zebra Data Services: configuración de conexión, enrolado de sensores, creación y control de tareas de monitoreo, y consulta de logs y alarmas.

La aplicación está pensada para ejecutarse junto con un **API Node + SQLite** (`server/`) para usuarios (JWT) y respaldo de listados. El front **requiere** `VITE_BACKEND_URL` apuntando a ese servidor.

## Dónde se guarda la información

| Qué | Dónde |
|-----|--------|
| **Sensores, tareas, logs, alarmas (datos operativos)** | En **Zebra Data Services** (APIs en la nube). La SPA solo los consulta o modifica en tiempo real. |
| **URL de Zebra, API key, logo, favicon** | En el **navegador** (`localStorage`) si los guardas desde **Configuración**; si no, valores por defecto del `.env` del front (`VITE_API_*`). |
| **Sesión de login** | En **`localStorage`**: **JWT** emitido por el API Node (`VITE_BACKEND_URL`). |
| **Usuarios y copia de listados** | En **SQLite** (`server/data/…`): contraseñas con hash; respaldo de listados de sensores/tareas cuando un administrador refresca esas pantallas. |

## Características

- **API Node (SQLite):** usuarios, JWT, cambio obligatorio de contraseña en el primer acceso de arranque, sincronización de listados. Ver [docs/backend_sqlite.md](docs/backend_sqlite.md).
- **Configuración:** Base URL y API key desde la interfaz (localStorage) o valores por defecto desde `.env`.
- **Branding opcional:** Logo y favicon (localStorage del navegador).
- **Sensores / Tareas / Inicio / Webhooks** como en versiones anteriores (véase [docs/user_guide.md](docs/user_guide.md)).

## Requisitos

- [Node.js](https://nodejs.org/) 18+ recomendado.
- npm (o yarn/pnpm).

## Instalación

```bash
git clone <tu-repo>
cd zebra_sensors
npm install
npm run server:install
```

```bash
cp .env.example .env
```

Edita **`.env` en la raíz** (único archivo de configuración). Incluye:

- **API Node + SQLite:** `BACKEND_PORT` (no uses `PORT` para el API; `PORT` es el del front compilado), `JWT_SECRET`, `DATABASE_PATH`, `CORS_ORIGIN`, `BOOTSTRAP_ADMIN_*`. Debe coincidir **`VITE_BACKEND_URL`** con `http://localhost:<BACKEND_PORT>`.
- **Vite (dev):** `DEV_HOST`, `DEV_PORT` — usados solo por `npm run dev`.
- **Vite (estático):** `HOST`, `PORT` — usados al servir `dist/` en `npm start` (junto con el API; el mismo comando levanta ambos).
- Opcional: `ALLOWED_HOSTS`.

Detalle: [docs/backend_sqlite.md](docs/backend_sqlite.md).

## Backend (SQLite)

- Código en **`server/`**; dependencias nativas: `npm run server:install` una vez.
- Toda la configuración del proceso Node está en el **`.env` de la raíz** (el servidor carga `../.env` respecto a `server/`).
- **Primer login:** `admin` / `changeme` por defecto si la base está vacía; la UI exige cambiar la contraseña. Más: [docs/backend_sqlite.md](docs/backend_sqlite.md).

## Scripts npm

| Comando | Uso |
|--------|-----|
| `npm run dev` | Arranca **a la vez** el front (Vite, `DEV_*`) y el **API Node** (SQLite, `BACKEND_PORT`). Un solo terminal. |
| `npm run server:install` | Instala dependencias bajo `server/` (mejor-sqlite3, etc.). |
| `npm run build` | Genera `dist/`. |
| `npm start` | Compila (`prestart`) y arranca **a la vez** `vite preview` (`HOST`/`PORT`) y el **API Node**. |
| `npm run preview` | Solo sirve `dist/` con Vite, **sin** levantar el API (por si ya tienes el backend en otro sitio). |
| `npm run seed` | Añade un usuario a SQLite; ver `package.json` / [docs/backend_sqlite.md](docs/backend_sqlite.md). |

### Producción y PM2

`npm start` ya incluye front + API. Un solo proceso PM2:

```bash
pm2 start npm --name zebra-sensor-manager -- start
```

## Configuración de la API Zebra

1. Application key en el [portal Zebra](https://developer.zebra.com/user/apps).
2. Menú **Configuración** en la app o `VITE_API_*` en `.env`.

Documentación: [docs/api_configuration.md](docs/api_configuration.md), [docs/user_guide.md](docs/user_guide.md).

## Uso rápido

1. Copia `.env.example` → `.`, edita `JWT_SECRET`, `VITE_BACKEND_URL`, etc.
2. `npm install` y `npm run server:install`.
3. **`npm run dev`** (desarrollo) o **`npm start`** (build + producción local): un solo comando para front y API.
4. Abre la URL del front (`DEV_PORT` en dev, típicamente 5173; tras `npm start`, `PORT` del front estático, típicamente 4173). Inicia sesión (primer usuario: [backend_sqlite.md](docs/backend_sqlite.md)).

## Alineación con las APIs Zebra

- [docs/reference_zebra_apis.md](docs/reference_zebra_apis.md)
- [Data Reporting — Electronic Temperature Sensors](https://developer.zebra.com/apis/data-reporting-electronic-temperature-sensors)
- [Management — Electronic Temperature Sensors](https://developer.zebra.com/apis/management-electronic-temperature-sensors)

## Estructura del repositorio

- **`src/`** — React + Vite.
- **`server/`** — API Node + SQLite.
- **`docs/`** — guías.

## Licencia

Véase [LICENSE](LICENSE).
