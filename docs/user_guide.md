# Guía de usuario — Zebra Sensor Manager

## 1. Autenticación

### Inicio de sesión

Al abrir la aplicación verás la pantalla de login.

- Las llamadas de login van al mismo host en **`/api/…`** (SQLite). Solo necesitas **`VITE_BACKEND_URL`** si el front no está en el mismo origen que el API.
- **Usuario** y **contraseña** se validan en la base SQLite del servidor; la sesión usa **JWT** (del orden de 24 h).

### Primer administrador

Si la base de datos del servidor no tenía usuarios, el primer arranque crea un administrador según `BOOTSTRAP_ADMIN_*` en el `.env` de la raíz (por defecto **usuario `admin`**, **contraseña `changeme`**). Debes **cambiar esa contraseña** en la pantalla inicial antes de usar el resto de la aplicación. Detalle: [backend_sqlite.md](backend_sqlite.md).

### Usuarios (solo administrador)

Menú **Usuarios**: crear y eliminar cuentas de acceso a la app (roles `admin` y `operator`). Solo lo ven los usuarios con rol **administrador**.

### Roles (administrador y operador)

- **Operador** (`operator`): gestión completa en Zebra — **Configuración**, **Sensores** (enrolar / desenrolar), **Tareas** (crear, detener, asociar sensores, activos, logs, alarmas). No puede abrir **Usuarios**.
- **Administrador** (`admin`): lo mismo que el operador **más** el menú **Usuarios**.

### Cerrar sesión

En la parte inferior del menú (lateral en escritorio o panel en móvil), **Cerrar sesión** te devuelve al login.

## 2. Inicio (panel principal)

Vista tipo **dashboard**: total de sensores, resumen de estado, tarjeta por sensor con **temperatura actual** (última conocida del listado) y un **histórico breve** (lecturas vía `GET …/environmental-sensors/{id}/readings` cuando la API lo permita; si falla o viene vacío, se muestra la última lectura no verificada del listado). Botón **Actualizar** y enlace a **Sensores** para la gestión completa.

Sobre webhooks vs polling, véase [webhooks.md](webhooks.md) (no forma parte de esta pantalla).

## 3. Configuración

- Los valores por defecto de **Base URL** y **API Key** vienen del `.env` (`ZEBRA_API_BASE_URL`, `ZEBRA_API_KEY`). Opcionalmente puedes guardar otros valores en el navegador desde esta pantalla.
- **Logo** y **Favicon** (opcional) — archivos locales guardados solo en este navegador.
- **Guardar configuración** / **Limpiar configuración guardada**.

Más detalle en [api_configuration.md](api_configuration.md).

## 4. Sensores

- **Buscar** — filtra por texto (`text_filter`: nombre, MAC o número de serie).
- **Filtros avanzados** — panel opcional: `task_id`, estados del sensor (`statuses`), estados sensor-en-tarea (`sensor_task_statuses`, útiles junto con `task_id`), fechas `enrolled_after` / `enrolled_before`, exclusión de batería baja, y campo de orden (véase `src/constants/zebraFilters.js` para valores típicos).
- **Paginación** — tamaño de página y botones anterior/siguiente; se muestra el total según la API.
- **Última temperatura** — si aparece como no válida (~327,67 °C), el sensor puede estar saliendo de reposo; es el comportamiento descrito por Zebra.
- **Refrescar**, **Enrolar**, **Desenrolar** como antes.
- **Copia en servidor:** cada vez que un usuario **administrador u operador** carga la lista desde Zebra, la app puede enviar un snapshot a SQLite (`sensor_snapshots`) como respaldo del último listado visto.

## 5. Tareas

- **Buscar** y **paginación** en la lista de tareas.
- **Filtros avanzados** — `updated_from` / `updated_to`, `sensor_mac_address`, y uno o varios `statuses` de tarea (valores en `src/constants/zebraFilters.js`).
- Al expandir una tarea:
  - **Log de datos** — primera página con límite configurable; **Cargar más** usa el `cursor` devuelto por la API; filtros opcionales de tiempo y sensor; tabla resumida y JSON de la última página.
  - **Alarmas** — páginas con **Cargar página 1** y **Siguiente página**; tabla con temperaturas formateadas.
  - **Añadir activo** — enlaza un identificador de negocio (p. ej. GS1 / URI de activo logístico) a la tarea vía API (`asset`, `id_format`; en la app, `ASSET_ID_FORMAT_GS1_URI`). No sustituye a “asociar sensor”.
  - **Asociar sensor**, **Detener tarea**.

- **Copia en servidor:** con usuario **administrador u operador**, al cargar la lista desde Zebra se sincroniza un snapshot en SQLite (`task_snapshots`).

## 6. Ejecución

- **`npm run dev`** — un solo proceso: Express con Vite en desarrollo y API en **`HOST`** / **`PORT`** (por defecto puerto 5173).
- **`npm start`** — build y un solo proceso que sirve **`dist/`** + API. Ver [README](../README.md) y [backend_sqlite.md](backend_sqlite.md).
- **`npm run preview`** — sirve `dist/` ya compilado + API (sin volver a ejecutar el build previo del `prestart`).

## 7. Documentación Zebra

[reference_zebra_apis.md](reference_zebra_apis.md) y enlaces oficiales allí listados.
