/**
 * Valores para query params alineados con la colección Postman del repo y la guía de desarrolladores Zebra
 * (Electronic Temperature Sensors). Si el portal OpenAPI lista más valores, usa el campo «sort_field»
 * personalizado en la UI o amplía estas listas.
 */

/**
 * Listado GET /devices/environmental-sensors — en Postman aparece SORT_FIELD_NAME.
 * Otros valores deben coincidir con el OpenAPI del portal; usa «sort_field personalizado» en la UI si el enum difiere.
 */
export const SENSOR_SORT_FIELDS = [{ value: 'SORT_FIELD_NAME', label: 'Nombre' }];

/** Listado GET /environmental/tasks — Postman usa SORT_FIELD_NAME por defecto. */
export const TASK_SORT_FIELDS = [{ value: 'SORT_FIELD_NAME', label: 'Nombre' }];

/** Filtro `statuses` en sensores (dispositivo). */
export const SENSOR_DEVICE_STATUSES = [
  { value: 'SENSOR_STATUS_ACTIVE', label: 'Activo' },
  { value: 'SENSOR_STATUS_STOPPED', label: 'Detenido' },
  { value: 'SENSOR_STATUS_ACTIVE_WITH_ALARM', label: 'Activo con alarma' },
];

/**
 * Filtro `sensor_task_statuses` (con `task_id` en la misma petición).
 * Incluye variantes que aparecen en respuestas de ejemplo / guía Zebra.
 */
export const SENSOR_TASK_STATUSES = [
  { value: 'SENSOR_TASK_STATUS_ACTIVE', label: 'Activo en tarea' },
  { value: 'SENSOR_TASK_STATUS_ACTIVE_WITH_ALARM', label: 'Activo en tarea con alarma' },
  { value: 'SENSOR_TASK_STATUS_COMPLETED', label: 'Completado en tarea' },
  { value: 'SENSOR_TASK_STATUS_STOP_PENDING', label: 'Parada pendiente' },
  { value: 'SENSOR_TASK_STATUS_START_PENDING', label: 'Inicio pendiente en tarea' },
];

/** Filtro `statuses` en tareas. Incluye TASK_STATUS_STOP_PENDING citado en la guía de desarrolladores. */
export const TASK_STATUSES = [
  { value: 'TASK_STATUS_ACTIVE', label: 'Activa' },
  { value: 'TASK_STATUS_SENSOR_REQUIRED', label: 'Requiere sensor' },
  { value: 'TASK_STATUS_START_PENDING', label: 'Inicio pendiente' },
  { value: 'TASK_STATUS_STOP_PENDING', label: 'Parada pendiente' },
];
