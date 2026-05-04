/**
 * Zabbix JSON-RPC (api_jsonrpc.php). Usa history.push (Zabbix 7+) en lugar de zabbix_sender.
 *
 * Autenticación:
 * - Zabbix 6.0.x: el PHP pasa `$call['auth']` del cuerpo JSON a la API (no usa solo Bearer en muchas instalaciones).
 * - Versiones más nuevas: también aceptan `Authorization: Bearer <token>`.
 * Para tokens enviamos Bearer y el mismo valor en `auth` del JSON (compatibilidad 6.0 + recientes).
 *
 * Depuración: define `ZABBIX_RPC_DEBUG=1` (o `true`) en el entorno del proceso Node para registrar en consola
 * URL, método, modo de auth y respuestas de error (sin volcar el token completo).
 *
 * @see https://www.zabbix.com/documentation/current/en/manual/api
 */

function zabbixRpcDebugEnabled() {
  const v = String(process.env.ZABBIX_RPC_DEBUG || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function maskSecret(s) {
  const t = String(s || '');
  if (!t) return '(vacío)';
  if (t.length <= 8) return `(${t.length} caracteres)`;
  return `${t.length} chars …${t.slice(-4)}`;
}

function logZabbixRpcDebug(label, data) {
  if (!zabbixRpcDebugEnabled()) return;
  const line = typeof data === 'string' ? data : JSON.stringify(data);
  console.log(`[zabbix-rpc] ${label} ${line}`);
}

export function normalizeZabbixApiUrl(input) {
  const raw = String(input || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  if (/api_jsonrpc\.php$/i.test(raw)) return raw;
  return `${raw}/api_jsonrpc.php`;
}

let sessionCache = {
  key: '',
  session: null,
  expiresAt: 0,
};

function cacheKey(url, username) {
  return `${url}\0${username}`;
}

/**
 * @param {string} apiUrl
 * @param {object} payload - cuerpo JSON-RPC
 * @param {{ kind: 'token'|'session', value: string }|null|undefined} zabbixAuth
 */
export async function zabbixJsonRpc(apiUrl, payload, zabbixAuth) {
  const headers = { 'Content-Type': 'application/json-rpc', Accept: 'application/json' };
  if (zabbixAuth?.kind === 'token' && zabbixAuth.value) {
    headers.Authorization = `Bearer ${zabbixAuth.value}`;
  }
  const method = payload?.method || '?';
  const authDesc =
    zabbixAuth?.kind === 'token'
      ? `token Bearer+JSON.auth token=${maskSecret(zabbixAuth.value)}`
      : zabbixAuth?.kind === 'session'
        ? `session JSON.auth session=${maskSecret(zabbixAuth.value)}`
        : 'sin auth en cabecera';
  logZabbixRpcDebug('request', {
    url: apiUrl,
    method,
    auth: authDesc,
    bodyPreview: (() => {
      try {
        const clone = JSON.parse(JSON.stringify(payload));
        if (clone.auth != null && clone.auth !== '') clone.auth = '[REDACTED]';
        return clone;
      } catch {
        return '(no serializable)';
      }
    })(),
  });

  const r = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    logZabbixRpcDebug('parse_error', { httpStatus: r.status, textHead: String(text).slice(0, 400) });
    throw new Error(`Zabbix: respuesta no JSON (${r.status})`);
  }
  if (json.error) {
    const msg = json.error?.data || json.error?.message || JSON.stringify(json.error);
    logZabbixRpcDebug('jsonrpc_error', {
      httpStatus: r.status,
      method,
      code: json.error?.code,
      message: json.error?.message,
      data: json.error?.data,
    });
    const err = new Error(String(msg));
    err.code = json.error?.code;
    throw err;
  }
  if (zabbixRpcDebugEnabled()) {
    logZabbixRpcDebug('ok', { httpStatus: r.status, method, hasResult: json.result !== undefined });
  }
  return json.result;
}

export async function zabbixUserLogin(apiUrl, username, password) {
  const result = await zabbixJsonRpc(apiUrl, {
    jsonrpc: '2.0',
    method: 'user.login',
    params: { username, password },
    id: 1,
  });
  return typeof result === 'string' ? result : null;
}

export async function getZabbixAuthSession(apiUrl, authType, { apiToken, username, password }) {
  if (authType === 'token' && apiToken) {
    return { kind: 'token', value: apiToken };
  }
  if (authType === 'password' && username && password) {
    const k = cacheKey(apiUrl, username);
    const now = Date.now();
    if (sessionCache.key === k && sessionCache.session && sessionCache.expiresAt > now) {
      return { kind: 'session', value: sessionCache.session };
    }
    const session = await zabbixUserLogin(apiUrl, username, password);
    if (!session) throw new Error('Zabbix: user.login no devolvió sesión');
    sessionCache = {
      key: k,
      session,
      expiresAt: now + 50 * 60 * 1000,
    };
    return { kind: 'session', value: session };
  }
  throw new Error('Zabbix: faltan credenciales (token o usuario/contraseña)');
}

/**
 * @param {string} method
 * @param {object|array} params
 * @param {{ kind: 'token'|'session', value: string }|null|undefined} zabbixAuth
 */
export function buildJsonRpcBody(method, params, zabbixAuth) {
  const body = {
    jsonrpc: '2.0',
    method,
    params,
    id: Math.floor(Math.random() * 1e9),
  };
  // Zabbix 6.0.x JSON-RPC usa el campo `auth` del cuerpo (token de API o sesión user.login).
  // La cabecera Bearer la añade zabbixJsonRpc para instalaciones que también la lean.
  if (zabbixAuth?.value && (zabbixAuth.kind === 'session' || zabbixAuth.kind === 'token')) {
    body.auth = zabbixAuth.value;
  }
  return body;
}

/** Prueba conexión: apiinfo.version sin auth, luego opcionalmente con auth. */
export async function testZabbixConnection(apiUrl, authType, creds) {
  const url = normalizeZabbixApiUrl(apiUrl);
  if (!url) throw new Error('URL de Zabbix vacía');
  const version = await zabbixJsonRpc(url, {
    jsonrpc: '2.0',
    method: 'apiinfo.version',
    params: [],
    id: 1,
  });
  let authed = null;
  try {
    const zabbixAuth = await getZabbixAuthSession(url, authType, creds);
    authed = await zabbixJsonRpc(
      url,
      buildJsonRpcBody('host.get', { output: ['hostid'], limit: 1 }, zabbixAuth),
      zabbixAuth
    );
  } catch (e) {
    return { ok: true, version, authOk: false, authError: String(e.message || e) };
  }
  return { ok: true, version, authOk: true, hostProbe: Array.isArray(authed) ? authed.length : authed };
}

export async function zabbixHistoryPush(apiUrl, zabbixAuth, dataRows) {
  if (!dataRows?.length) return { processed: 0 };
  const url = normalizeZabbixApiUrl(apiUrl);
  return zabbixJsonRpc(url, buildJsonRpcBody('history.push', { data: dataRows }, zabbixAuth), zabbixAuth);
}

export async function zabbixHostList(apiUrl, zabbixAuth) {
  const url = normalizeZabbixApiUrl(apiUrl);
  return zabbixJsonRpc(
    url,
    buildJsonRpcBody(
      'host.get',
      {
        output: ['hostid', 'host', 'name'],
        selectInterfaces: ['interfaceid', 'main', 'type'],
        sortfield: 'name',
      },
      zabbixAuth
    ),
    zabbixAuth
  );
}

export async function zabbixItemGetByHostAndKey(apiUrl, zabbixAuth, hostid, key_) {
  const url = normalizeZabbixApiUrl(apiUrl);
  const rows = await zabbixJsonRpc(
    url,
    buildJsonRpcBody(
      'item.get',
      {
        hostids: [String(hostid)],
        filter: { key_: [String(key_)] },
        output: ['itemid', 'name', 'key_', 'status'],
      },
      zabbixAuth
    ),
    zabbixAuth
  );
  return Array.isArray(rows) ? rows : [];
}

export async function zabbixItemCreateTrapper(apiUrl, zabbixAuth, params) {
  const url = normalizeZabbixApiUrl(apiUrl);
  return zabbixJsonRpc(url, buildJsonRpcBody('item.create', [params], zabbixAuth), zabbixAuth);
}
