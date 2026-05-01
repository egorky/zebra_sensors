# Referencia: APIs oficiales Zebra y esta aplicación

Este documento relaciona la documentación pública de Zebra con lo que **Zebra Sensor Manager** implementa en la interfaz y en `src/services/api.js`.

## Enlaces oficiales

- [Data Reporting for Electronic Temperature Sensors](https://developer.zebra.com/apis/data-reporting-electronic-temperature-sensors) — API de datos (p. ej. log completo de una tarea).
- [Management for Electronic Temperature Sensors](https://developer.zebra.com/apis/management-electronic-temperature-sensors) — API de gestión (enrolado, tareas, sensores en tarea, detener tarea).
- [Guía del desarrollador (Management and Data Reporting)](https://docs.zebra.com/content/tcm/us/en/solutions/intelligent-sensors/zszb-dev-guide/management-and-data-reporting-for-electronic-tempe.html).
- [Colección Postman oficial](https://github.com/ZebraDevs/ZDS-Electronic_Temperature_Sensors-Postman_Collection).
- Manual PDF de gestión y datos (guía de producto): [P1131383-02EN](https://www.zebra.com/content/dam/support-dam/en/documentation/unrestricted/guide/product/P1131383-02EN-mangagement-data-electronic-temp-dg-en.pdf).

**Autenticación:** las APIs usan el encabezado `apikey` con una clave de aplicación Zebra Data Services (véase la [página de aplicaciones](https://developer.zebra.com/user/apps)). Esta app solo envía `apikey` y `Accept` según el código actual.

## Resumen según el portal de desarrolladores

| Área | Acciones descritas en el portal | ¿La app las cubre? |
|------|--------------------------------|--------------------|
| Management | Enrolar un sensor | Sí — enrolar / desenrolar |
| Management | Crear una tarea | Sí |
| Management | Añadir sensores a una tarea | Sí |
| Management | Detener tarea | Sí |
| Data reporting | Obtener el log completo de datos de una tarea | Sí — log con `limit` + **cursor** (`nextCursor`), filtros opcionales |
| Listados auxiliares | Listar sensores del tenant, detalle de tarea | Sí — **paginación**, `text_filter`, orden |
| Webhooks (documentación) | Eventos push vs polling | Explicado en [docs/webhooks.md](webhooks.md) e inicio de la app (sin receptor en esta SPA) |

## Activos en tarea

**`addTaskAsset`** está expuesto en el detalle de tarea (formulario activo + `id_format`, p. ej. `ASSET_ID_FORMAT_GS1_URI`).

## Parámetros y límites

- Sensores y tareas: `page`, `size`, `text_filter`, `sort_field` / `sort_order`. La pantalla incluye **filtros avanzados** alineados con Postman (`task_id`, `statuses`, `sensor_task_statuses`, `enrolled_*`, `exclude_low_battery`; en tareas `updated_*`, `sensor_mac_address`, `statuses`). Los valores de estado y ordenación editables están en `src/constants/zebraFilters.js` (incluye ampliaciones respecto a Postman y **TASK_STATUS_STOP_PENDING** de la guía Zebra); puedes **anular `sort_field`** con el campo de texto opcional en filtros avanzados si tu OpenAPI usa otro enum.
- Log de datos: `GET .../data/environmental/tasks/{id}/log` con `limit` (1–14000), `cursor` para la página siguiente, y opcionalmente `startTime`, `endTime`, `sensorTaskId`, `deviceId` (véase Postman / portal).
- Alarmas de tarea: `page.page` y `page.size` en la query.
- Lectura **327,67 °C**: la app la trata como valor no válido (sensor despertando), según la guía de listado ZS300.

Para detalles de esquemas de cuerpo (JSON), códigos de error y flujos edge, usa la guía PDF enlazada arriba y la colección Postman oficial junto con el explorador en [developer.zebra.com](https://developer.zebra.com).
