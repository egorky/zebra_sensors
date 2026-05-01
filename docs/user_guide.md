# Guía de usuario — Zebra Sensor Manager

## 1. Autenticación

### Inicio de sesión

Al abrir la aplicación verás la pantalla de login.

- **Con backend SQLite** (`VITE_BACKEND_URL` en el `.env` del front apuntando a la API Node en `server/`): usuario y contraseña se validan contra la base SQLite del servidor; recibes un **JWT** (sesión del orden de 24 h). El primer arranque del servidor puede crear un administrador con `BOOTSTRAP_ADMIN_*` en `server/.env` (véase el [README](../README.md) sección *Backend (SQLite)*).
- **Sin backend** (sin `VITE_BACKEND_URL`): las credenciales coinciden con `VITE_APP_USERNAME` / `VITE_APP_PASSWORD` o la lista JSON `VITE_APP_USERS` del `.env` con el que se compiló la app (sesión en navegador ~1 h).

Tras un inicio correcto accedes al panel principal.

### Usuarios (solo administrador, con backend)

Si el backend está activo, el menú **Usuarios** permite crear y eliminar cuentas en SQLite (roles `admin` y `operator`). Sin `VITE_BACKEND_URL` ese menú no aplica: los accesos van solo por variables `VITE_APP_*` y hay que recompilar para cambiar usuarios.

### Cerrar sesión

En la parte inferior del menú lateral, **Cerrar sesión** te devuelve a la pantalla de login.

## 2. Inicio (panel principal)

Vista tipo **dashboard**: total de sensores, resumen de estado, tarjeta por sensor con **temperatura actual** (última conocida del listado) y un **histórico breve** (lecturas vía `GET …/environmental-sensors/{id}/readings` cuando la API lo permita; si falla o viene vacío, se muestra la última lectura no verificada del listado). Botón **Actualizar** y enlace a **Sensores** para la gestión completa.

Sobre webhooks vs polling, véase [webhooks.md](webhooks.md) (no forma parte de esta pantalla).

## 3. Configuración

- Los valores por defecto de **Base URL** y **API Key** vienen del `.env` (`VITE_API_*`). Opcionalmente puedes guardar otros valores en el navegador desde esta pantalla.
- **Logo** y **Favicon** (opcional) — archivos locales guardados solo en este navegador.
- **Guardar configuración** / **Limpiar configuración guardada**.

Más detalle en [api_configuration.md](api_configuration.md).

## 4. Sensores

- **Buscar** — filtra por texto (`text_filter`: nombre, MAC o número de serie).
- **Filtros avanzados** — panel opcional: `task_id`, estados del sensor (`statuses`), estados sensor-en-tarea (`sensor_task_statuses`, útiles junto con `task_id`), fechas `enrolled_after` / `enrolled_before`, exclusión de batería baja, y campo de orden (véase `src/constants/zebraFilters.js` para valores típicos).
- **Paginación** — tamaño de página y botones anterior/siguiente; se muestra el total según la API.
- **Última temperatura** — si aparece como no válida (~327,67 °C), el sensor puede estar saliendo de reposo; es el comportamiento descrito por Zebra.
- **Refrescar**, **Enrolar**, **Desenrolar** como antes.
- **Copia en servidor (opcional):** con backend configurado, cada vez que un **administrador** carga la lista desde Zebra, la app envía en segundo plano un volcado a SQLite (`sensor_snapshots`) como respaldo del último listado visto (no sustituye a Zebra).

## 5. Tareas

- **Buscar** y **paginación** en la lista de tareas.
- **Filtros avanzados** — `updated_from` / `updated_to`, `sensor_mac_address`, y uno o varios `statuses` de tarea (valores en `src/constants/zebraFilters.js`).
- Al expandir una tarea:
  - **Log de datos** — primera página con límite configurable; **Cargar más** usa el `cursor` devuelto por la API; filtros opcionales de tiempo y sensor; tabla resumida y JSON de la última página.
  - **Alarmas** — páginas con **Cargar página 1** y **Siguiente página**; tabla con temperaturas formateadas.
  - **Añadir activo** — cuerpo según API (`asset`, `id_format`).
  - **Asociar sensor**, **Detener tarea**.

- **Copia en servidor (opcional):** con backend y usuario administrador, al cargar la lista de tareas desde Zebra se sincroniza un snapshot en SQLite (`task_snapshots`).

## 6. Ejecución

- Desarrollo del front: `npm run dev`.
- API con SQLite (opcional): `npm run server:dev` desde la raíz del repo (tras `npm run server:install`). Detalle en el [README](../README.md).
- Producción: `npm start` (compila y sirve `dist/`); opcionalmente **PM2** — véase el [README](../README.md). Para solo servir sin recompilar: `npm run preview` si ya existe `dist/`.

## 7. Documentación Zebra

[reference_zebra_apis.md](reference_zebra_apis.md) y enlaces oficiales allí listados.
