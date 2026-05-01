/** Valor centinela documentado por Zebra cuando el sensor aún no tiene lectura válida (deep sleep). */
export const INVALID_ZEBRA_TEMP_SENTINEL = 327.67;

export function isInvalidZebraTemperature(value) {
  if (value === null || value === undefined || value === '') return false;
  const n = Number(value);
  return !Number.isNaN(n) && Math.abs(n - INVALID_ZEBRA_TEMP_SENTINEL) < 0.01;
}

export function formatZebraTemperature(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  if (isInvalidZebraTemperature(n)) {
    return 'No válida (sensor despertando)';
  }
  return `${n} °C`;
}
