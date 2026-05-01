# Zebra Sensor Manager

Interfaz web para gestionar sensores electrónicos de temperatura **Zebra** mediante las APIs de Management y Data Reporting de Zebra Data Services: configuración de conexión, enrolado de sensores, creación y control de tareas de monitoreo, y consulta de logs y alarmas.

## Dónde se guarda la información

| Qué | Dónde |
|-----|--------|
| **Sensores, tareas, logs, alarmas (datos operativos)** | En **Zebra Data Services** (APIs en la nube). La SPA solo los consulta o modifica en tiempo real; no hay copia local salvo la opción siguiente. |
| **URL de Zebra, API key, logo, favicon** | En el **navegador** (`localStorage`) si los guardas desde **Configuración**; si no, valores por defecto del `.env` del front (`VITE_API_*`). |
| **Sesión de login del front** | En **`localStorage`**: JWT si usas el **backend** (`VITE_BACKEND_URL`), o sesión corta (~1 h) si el login es solo con `VITE_APP_*` en el bundle. |
| **Usuarios y copia de listados** (opcional) | En **SQLite** en el servidor Node (`server/`): usuarios con contraseña hasheada; tablas de respaldo cuando un administrador refresca **Sensores** o **Tareas** con el backend activo. |

## Características

- **Backend opcional (SQLite):** API Node con usuarios, JWT y sincronización de listados de sensores/tareas. Ver [Backend (SQLite)](#backend-sqlite).
- **Configuración:** Base URL y API key desde la interfaz (localStorage) o valores por defecto desde `.env`.
- **Branding opcional:** Logo en la barra lateral y favicon cargados desde archivos locales (guardados en el navegador).
- **Sensores:** Paginación, filtro de texto, orden, **filtros avanzados** (task_id, estados, fechas de enrolado, batería baja); enrolar / desenrolar; aviso de temperatura no válida (~327,67 °C).
- **Tareas:** Paginación, filtro en lista, **filtros avanzados** (actualización, MAC de sensor, estados); detalle con **log por cursor**, **alarmas paginadas**, **añadir activo**, asociar sensores y detener tarea.
- **Inicio:** panel tipo dashboard con sensores enrolados, temperatura reciente y un histórico breve (listado + API de lecturas cuando exista).
- **Webhooks:** documentación en [docs/webhooks.md](docs/webhooks.md) (la app usa polling sobre las APIs REST).

## Requisitos

- [Node.js](https://nodejs.org/) 18+ recomendado (16+ suele funcionar).
- npm (o yarn/pnpm).

## Instalación

```bash
git clone <tu-repo>
cd zebra_sensors
npm install
npm run server:install
```

Copia variables de entorno de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus valores (API, login de la app, puertos si los necesitas).

Si vas a usar el backend SQLite, copia también `server/.env.example` a `server/.env`, define al menos `JWT_SECRET` (16+ caracteres) y ajusta `CORS_ORIGIN` al origen del front (p. ej. `http://localhost:5173`). Opcional: `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` para el primer usuario (por defecto `admin` / `changeme` si la base está vacía).

En el `.env` del **front**, si quieres login contra SQLite, añade por ejemplo `VITE_BACKEND_URL=http://localhost:3001` (misma URL que `PORT` del servidor). Sin esa variable, el login sigue siendo el modo solo front (`VITE_APP_USERNAME` / `VITE_APP_PASSWORD` o `VITE_APP_USERS`).

## Backend (SQLite)

- **Carpeta:** `server/` — dependencias propias (`npm run server:install`).
- **Arranque en desarrollo:** `npm run server:dev` (recarga con `--watch`).
- **Base de datos:** fichero configurable con `DATABASE_PATH` (por defecto `server/data/app.db`; la carpeta se crea sola).
- **API:** `POST /api/auth/login`, `GET /api/auth/me`, `GET|POST /api/users` (admin), `GET /api/sensors/cached`, `POST /api/sensors/sync` (admin), análogo para `/api/tasks/*`.
- **Usuarios en la UI:** con backend y sesión de administrador, menú **Usuarios** (`/users`).
- **CLI extra usuario:** desde `server/`, `node scripts/seed.js <usuario> <clave> [admin|operator]`.

## Scripts npm

| Comando | Uso |
|--------|-----|
| `npm run dev` | Servidor de desarrollo Vite (hot reload). |
| `npm run server:install` | Instala dependencias del backend en `server/`. |
| `npm run server:dev` | Arranca la API Node (SQLite) en desarrollo. |
| `npm run build` | Genera la carpeta `dist/` para producción. |
| `npm start` | Ejecuta **`npm run build`** automáticamente y luego sirve `dist/` con **Vite preview** (vía script `prestart` de npm). |
| `npm run preview` | Solo **Vite preview** (no recompila). Útil si ya tienes `dist/` y quieres arrancar el servidor más rápido. |

### Producción y PM2

El servidor de preview escucha por defecto en `0.0.0.0:4173`. Puedes cambiar host y puerto con variables en `.env`:

- `PREVIEW_HOST` (por defecto `0.0.0.0`)
- `PREVIEW_PORT` (por defecto `4173`)
- `PREVIEW_ALLOWED_HOSTS` — lista separada por comas si necesitas restringir el cabecero `Host` (opcional)

Ejemplo de arranque con PM2 desde la raíz del proyecto:

```bash
pm2 start npm --name zebra-sensor-manager -- start
```

(`npm start` ya incluye el build; en PM2 cada arranque/restart recompilará salvo que uses `preview` con un `dist` generado en CI.)

Para ver logs y estado: `pm2 logs zebra-sensor-manager`, `pm2 status`.

Tras un despliegue nuevo (por ejemplo tras `git pull`):

```bash
pm2 restart zebra-sensor-manager
```

Si prefieres no recompilar en cada restart de PM2, genera `dist/` en tu pipeline y usa en el ecosistema de PM2 el script `preview` en lugar de `start`.

## Configuración de la API Zebra

1. Obtén una **application key** en el [portal de desarrolladores Zebra](https://developer.zebra.com/user/apps).
2. En la app, menú **Configuración**, introduce la **Base URL** (p. ej. `https://api.zebra.com/v2` según tu entorno) y la **API Key**.
3. Opcional: sube **logo** y **favicon** (archivos locales; máximo recomendado 400 KB cada uno).
4. **Guardar configuración**. También puedes **Limpiar configuración guardada** para volver a los valores del `.env`.

Documentación ampliada: [docs/api_configuration.md](docs/api_configuration.md), [docs/user_guide.md](docs/user_guide.md).

## Uso rápido

- **Login:** con `VITE_BACKEND_URL`, contra **SQLite** en el servidor (usuario inicial vía `BOOTSTRAP_ADMIN_*` o `node server/scripts/seed.js`). Sin esa variable, credenciales en el `.env` del front (`VITE_APP_USERNAME`, `VITE_APP_PASSWORD` o `VITE_APP_USERS`).
- **Sensores:** refrescar lista, enrolar por número de serie, desenrolar.
- **Tareas:** crear desde el modal, expandir una tarea para asociar sensores, detener, **Extraer datos** / **Extraer alarmas**.

## Alineación con las APIs y documentación Zebra

Las APIs públicas descritas en el portal cubren gestión (enrolado, tareas, sensores en tarea, stop) y reporting de datos (log de tarea). Esta aplicación implementa esos flujos principales en la UI; detalles, límites y endpoints adicionales están en:

- [docs/reference_zebra_apis.md](docs/reference_zebra_apis.md)
- [Data Reporting — Electronic Temperature Sensors](https://developer.zebra.com/apis/data-reporting-electronic-temperature-sensors)
- [Management — Electronic Temperature Sensors](https://developer.zebra.com/apis/management-electronic-temperature-sensors)
- [Manual PDF P1131383-02EN](https://www.zebra.com/content/dam/support-dam/en/documentation/unrestricted/guide/product/P1131383-02EN-mangagement-data-electronic-temp-dg-en.pdf)

El repositorio incluye además `Zebra Copy.postman_collection.json` como referencia de peticiones.

## Estructura del repositorio

- **`src/`** — aplicación principal (React + Vite).
- **`server/`** — API Node + SQLite (usuarios, respaldo de listados).
- **`docs/`** — guías, referencia de APIs y [docs/webhooks.md](docs/webhooks.md).

## Licencia

Véase el archivo [LICENSE](LICENSE) del repositorio.
