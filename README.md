# Zebra Sensor Manager

Interfaz web para gestionar sensores electrónicos de temperatura **Zebra** mediante las APIs de Management y Data Reporting de Zebra Data Services: configuración de conexión, enrolado de sensores, creación y control de tareas de monitoreo, y consulta de logs y alarmas.

## Características

- **Configuración:** Base URL y API key desde la interfaz (localStorage) o valores por defecto desde `.env`.
- **Branding opcional:** Logo en la barra lateral y favicon cargados desde archivos locales (guardados en el navegador).
- **Sensores:** Paginación, filtro de texto, orden, **filtros avanzados** (task_id, estados, fechas de enrolado, batería baja); enrolar / desenrolar; aviso de temperatura no válida (~327,67 °C).
- **Tareas:** Paginación, filtro en lista, **filtros avanzados** (actualización, MAC de sensor, estados); detalle con **log por cursor**, **alarmas paginadas**, **añadir activo**, asociar sensores y detener tarea.
- **Webhooks:** resumen en la página de inicio y en `docs/webhooks.md` (esta SPA solo usa polling).

## Requisitos

- [Node.js](https://nodejs.org/) 18+ recomendado (16+ suele funcionar).
- npm (o yarn/pnpm).

## Instalación

```bash
git clone <tu-repo>
cd zebra_sensors
npm install
```

Copia variables de entorno de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus valores (API, login de la app, puertos si los necesitas).

## Scripts npm

| Comando | Uso |
|--------|-----|
| `npm run dev` | Servidor de desarrollo Vite (hot reload). |
| `npm run build` | Genera la carpeta `dist/` para producción. |
| `npm start` | Sirve `dist/` con **Vite preview** (modo producción local o proceso gestionado por PM2). |
| `npm run preview` | Equivalente a `npm start`. |

**Importante:** antes de `npm start` debes ejecutar al menos una vez `npm run build`.

### Producción y PM2

El servidor de preview escucha por defecto en `0.0.0.0:4173`. Puedes cambiar host y puerto con variables en `.env`:

- `PREVIEW_HOST` (por defecto `0.0.0.0`)
- `PREVIEW_PORT` (por defecto `4173`)
- `PREVIEW_ALLOWED_HOSTS` — lista separada por comas si necesitas restringir el cabecero `Host` (opcional)

Ejemplo de arranque con PM2 desde la raíz del proyecto:

```bash
npm run build
pm2 start npm --name zebra-sensor-manager -- start
```

Para ver logs y estado: `pm2 logs zebra-sensor-manager`, `pm2 status`.

Tras un despliegue nuevo:

```bash
npm run build && pm2 restart zebra-sensor-manager
```

## Configuración de la API Zebra

1. Obtén una **application key** en el [portal de desarrolladores Zebra](https://developer.zebra.com/user/apps).
2. En la app, menú **Configuración**, introduce la **Base URL** (p. ej. `https://api.zebra.com/v2` según tu entorno) y la **API Key**.
3. Opcional: sube **logo** y **favicon** (archivos locales; máximo recomendado 400 KB cada uno).
4. **Guardar configuración**. También puedes **Limpiar configuración guardada** para volver a los valores del `.env`.

Documentación ampliada: [docs/api_configuration.md](docs/api_configuration.md), [docs/user_guide.md](docs/user_guide.md).

## Uso rápido

- **Login:** credenciales definidas en `.env` (`VITE_APP_USERNAME`, `VITE_APP_PASSWORD`).
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
- **`docs/`** — guías, referencia de APIs y [docs/webhooks.md](docs/webhooks.md).

## Licencia

Véase el archivo [LICENSE](LICENSE) del repositorio.
