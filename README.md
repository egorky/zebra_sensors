# Zebra Sensor Manager

Interfaz web para gestionar sensores electrónicos de temperatura **Zebra** mediante las APIs de Management y Data Reporting de Zebra Data Services: configuración de conexión, enrolado de sensores, creación y control de tareas de monitoreo, y consulta de logs y alarmas.

Un único proceso **Node (Express)** sirve la SPA y el API (`/api`, SQLite, JWT). **`npm run dev`** usa Vite en modo middleware (hot reload); **`npm start`** sirve `dist/` desde el mismo servidor.

## Dónde se guarda la información

| Qué | Dónde |
|-----|--------|
| **Sensores, tareas, logs, alarmas (datos operativos)** | En **Zebra Data Services** (APIs en la nube). La SPA solo los consulta o modifica en tiempo real. |
| **URL de Zebra, API key, logo, favicon** | En el **navegador** (`localStorage`) si los guardas desde **Configuración**; si no, valores por defecto del `.env` del front (`VITE_API_*`). |
| **Sesión de login** | En **`localStorage`**: **JWT** emitido por el mismo host (`/api/auth/...`). |
| **Usuarios y copia de listados** | En **SQLite** (`server/data/…`): contraseñas con hash; respaldo de listados de sensores/tareas cuando un administrador refresca esas pantallas. |

## Características

- **Un solo puerto:** `HOST` y `PORT` en `.env` (por defecto desarrollo `5173`, producción `4173` si no defines `PORT`).
- **Configuración Zebra:** Base URL y API key desde la interfaz (localStorage) o valores por defecto desde `.env`.
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
```

(Un único `npm install` en la raíz instala el front y las dependencias del API — Express, SQLite, etc.)

Opcional: `npm run server:install` es un alias del mismo comando por compatibilidad.

```bash
cp .env.example .env
```

Edita **`.env` en la raíz**: `JWT_SECRET`, `PORT` si lo necesitas, `VITE_API_*` para Zebra. Opcional: **`VITE_BACKEND_URL`** solo si el front se sirve en otro dominio que el API; si está vacío, el cliente usa rutas relativas `/api/...` en el mismo origen.

Detalle del API y SQLite: [docs/backend_sqlite.md](docs/backend_sqlite.md).

## Scripts npm

| Comando | Uso |
|--------|-----|
| `npm run dev` | Un proceso: Vite (desarrollo) + API en **`PORT`** (por defecto 5173). |
| `npm run server:install` | Alias de `npm install` en la raíz (compatibilidad). |
| `npm run build` | Genera `dist/`. |
| `npm start` | Compila y arranca Express sirviendo **`dist/`** + API ( **`NODE_ENV=production`**, `PORT` por defecto 4173 si no lo pones en `.env`). |
| `npm run preview` | Igual que `start` sin ejecutar el `prestart` (usa `dist/` ya generado). |
| `npm run seed` | Añade un usuario a SQLite; ver [docs/backend_sqlite.md](docs/backend_sqlite.md). |

### Producción y PM2

```bash
pm2 start npm --name zebra-sensor-manager -- start
```

## Configuración de la API Zebra

1. Application key en el [portal Zebra](https://developer.zebra.com/user/apps).
2. Menú **Configuración** en la app o `VITE_API_*` en `.env`.

Documentación: [docs/api_configuration.md](docs/api_configuration.md), [docs/user_guide.md](docs/user_guide.md).

## Uso rápido

1. Copia `.env.example` → `.env`, edita al menos `JWT_SECRET`.
2. `npm install` en la raíz del repo.
3. **`npm run dev`** o **`npm start`**.
4. Abre `http://localhost:<PORT>` (según tu `.env`). Primer usuario: [docs/backend_sqlite.md](docs/backend_sqlite.md).

## Alineación con las APIs Zebra

- [docs/reference_zebra_apis.md](docs/reference_zebra_apis.md)
- [Data Reporting — Electronic Temperature Sensors](https://developer.zebra.com/apis/data-reporting-electronic-temperature-sensors)
- [Management — Electronic Temperature Sensors](https://developer.zebra.com/apis/management-electronic-temperature-sensors)

## Estructura del repositorio

- **`src/`** — React + Vite.
- **`server/`** — Express + SQLite (`/api`).
- **`docs/`** — guías.

## Licencia

Véase [LICENSE](LICENSE).
