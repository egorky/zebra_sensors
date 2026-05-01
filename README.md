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
cp server/.env.example server/.env
```

- **Raíz `.env`:** al menos `VITE_BACKEND_URL` (misma base que el API, p. ej. `http://localhost:3001`) y `VITE_API_*` si quieres valores por defecto de Zebra. Variables **`DEV_HOST` / `DEV_PORT`** ajustan el servidor de Vite en `npm run dev`; **`HOST` / `PORT`** ajustan el servidor estático al servir `dist/` (`npm start` / `npm run preview`). Opcional: **`ALLOWED_HOSTS`** (hosts permitidos, separados por coma).
- **`server/.env`:** `JWT_SECRET` (≥16 caracteres), `CORS_ORIGIN` alineado con el origen del front, `PORT` del API (p. ej. 3001). Para el primer usuario: `BOOTSTRAP_ADMIN_*` (por defecto `admin` / `changeme`); ver [docs/backend_sqlite.md](docs/backend_sqlite.md).

## Backend (SQLite)

Resumen: **[docs/backend_sqlite.md](docs/backend_sqlite.md)**.

- **Carpeta:** `server/`
- **Puerto del API:** `PORT` en `server/.env` (por defecto 3001). **Debe coincidir** con el host/puerto de `VITE_BACKEND_URL`.
- **Desarrollo API:** `npm run server:dev`
- **Primer login:** usuario por defecto `admin` / `changeme` si la base está vacía; la UI **fuerza** a cambiar la contraseña antes de continuar.

## Scripts npm

| Comando | Uso |
|--------|-----|
| `npm run dev` | Vite en modo desarrollo (hot reload). Puertos: `DEV_HOST`, `DEV_PORT` en `.env`. |
| `npm run server:install` | Dependencias del directorio `server/`. |
| `npm run server:dev` | API Node + SQLite con recarga. |
| `npm run build` | Genera `dist/`. |
| `npm start` | `npm run build` y luego sirve `dist/` con Vite preview. Host/puerto: `HOST`, `PORT` en `.env`. |
| `npm run preview` | Solo sirve `dist/` (sin rebuild). |

### Producción y PM2

Por defecto el servidor estático usa **`HOST=0.0.0.0`** y **`PORT=4173`** en `.env` si no defines otras. Ejemplo:

```bash
pm2 start npm --name zebra-sensor-manager -- start
```

Arranca también el API Node en otro proceso PM2 apuntando a `npm run start --prefix server` o equivalente.

## Configuración de la API Zebra

1. Application key en el [portal Zebra](https://developer.zebra.com/user/apps).
2. Menú **Configuración** en la app o `VITE_API_*` en `.env`.

Documentación: [docs/api_configuration.md](docs/api_configuration.md), [docs/user_guide.md](docs/user_guide.md).

## Uso rápido

1. Arranca el API (`npm run server:dev`) y el front (`npm run dev`), con `.env` y `server/.env` configurados.
2. Abre la URL del front; inicia sesión (primer usuario: ver backend_sqlite.md).
3. **Sensores / Tareas** como de costumbre.

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
