import {
  getZabbixAuthSession,
  normalizeZabbixApiUrl,
  zabbixHostList,
  zabbixItemGetByHostAndKey,
  zabbixItemCreateTrapper,
} from './zabbixRpc.js';

function itemKeyFromTemplate(template, sensorZebraId) {
  const t = String(template || 'alarm.{sensorId}');
  return t.replace(/\{sensorId\}/g, String(sensorZebraId));
}

/** Nombre visible del ítem: "Alarmas " + nombre del sensor (o serial / id). */
export function alarmItemName(zebraId, sensorName, serialNumber) {
  const part = String(sensorName || serialNumber || zebraId || '').trim();
  if (!part) return `Alarmas ${zebraId}`;
  if (/^alarmas\s/i.test(part)) return part;
  return `Alarmas ${part}`;
}

function pickPrimaryInterfaceId(hostRow) {
  const ifaces = hostRow?.interfaces;
  if (!Array.isArray(ifaces) || !ifaces.length) return null;
  const main = ifaces.find((i) => String(i.main) === '1');
  return String((main || ifaces[0]).interfaceid);
}

function zabbixCredsFromSettings(settings) {
  return {
    apiToken: String(settings.zabbix_api_token || '').trim(),
    username: String(settings.zabbix_username || '').trim(),
    password: String(settings.zabbix_password || '').trim(),
  };
}

export async function getZabbixAuthForSettings(settings) {
  const zabbixUrl = String(settings.zabbix_api_url || '').trim();
  if (!zabbixUrl) throw new Error('Configura la URL de Zabbix en Integración');
  const apiUrl = normalizeZabbixApiUrl(zabbixUrl);
  const authType = settings.zabbix_auth_type === 'password' ? 'password' : 'token';
  const auth = await getZabbixAuthSession(apiUrl, authType, zabbixCredsFromSettings(settings));
  return { apiUrl, auth };
}

export async function listZabbixHosts(settings) {
  const { apiUrl, auth } = await getZabbixAuthForSettings(settings);
  const hosts = await zabbixHostList(apiUrl, auth);
  return Array.isArray(hosts) ? hosts : [];
}

export async function checkSensorZabbixItem(db, settings, { hostid, sensorZebraId }) {
  const hid = String(hostid || '').trim();
  const sid = String(sensorZebraId || '').trim();
  if (!hid || !sid) throw new Error('hostid y sensor_zebra_id son obligatorios');

  const row = await db.get(`SELECT zebra_id, name, serial_number FROM sensor_snapshots WHERE zebra_id = ?`, [sid]);
  if (!row) throw new Error('Sensor no encontrado en la caché del servidor; sincroniza sensores primero.');

  const key = itemKeyFromTemplate(settings.item_key_template, sid);
  const name = alarmItemName(sid, row.name, row.serial_number);

  const { apiUrl, auth } = await getZabbixAuthForSettings(settings);
  const existing = await zabbixItemGetByHostAndKey(apiUrl, auth, hid, key);

  return {
    itemName: name,
    itemKey: key,
    exists: existing.length > 0,
    existing: existing.slice(0, 5),
  };
}

export async function createSensorZabbixTrapperItem(db, settings, { hostid, sensorZebraId }) {
  const check = await checkSensorZabbixItem(db, settings, { hostid, sensorZebraId });
  if (check.exists) {
    const err = new Error('Ya existe un ítem en Zabbix con esa clave en el host indicado');
    err.code = 'ITEM_EXISTS';
    throw err;
  }

  const { apiUrl, auth } = await getZabbixAuthForSettings(settings);
  const hosts = await zabbixHostList(apiUrl, auth);
  const host = (hosts || []).find((h) => String(h.hostid) === String(hostid));
  if (!host) throw new Error('Host no encontrado en Zabbix');

  const interfaceid = pickPrimaryInterfaceId(host);
  if (!interfaceid) throw new Error('El host en Zabbix no tiene interfaz utilizable para crear el ítem');

  const params = {
    hostid: String(hostid),
    name: check.itemName,
    key_: check.itemKey,
    type: 2,
    value_type: 4,
    delay: '0',
    interfaceid,
  };

  return zabbixItemCreateTrapper(apiUrl, auth, params);
}
