/**
 * Zabbix JSON-RPC (api_jsonrpc.php). Usa history.push (Zabbix 7+) en lugar de zabbix_sender.
 * @see https://www.zabbix.com/documentation/current/en/manual/api
 */

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

export async function zabbixJsonRpc(apiUrl, payload) {
  const r = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json-rpc', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Zabbix: respuesta no JSON (${r.status})`);
  }
  if (json.error) {
    const msg = json.error?.data || json.error?.message || JSON.stringify(json.error);
    const err = new Error(String(msg));
    err.code = json.error?.code;
    throw err;
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

export function buildJsonRpcBody(method, params, authValue) {
  const body = {
    jsonrpc: '2.0',
    method,
    params,
    id: Math.floor(Math.random() * 1e9),
  };
  if (authValue != null && authValue !== '') {
    body.auth = authValue;
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
    const auth = await getZabbixAuthSession(url, authType, creds);
    authed = await zabbixJsonRpc(
      url,
      buildJsonRpcBody('host.get', { output: ['hostid'], limit: 1 }, auth.value)
    );
  } catch (e) {
    return { ok: true, version, authOk: false, authError: String(e.message || e) };
  }
  return { ok: true, version, authOk: true, hostProbe: Array.isArray(authed) ? authed.length : authed };
}

export async function zabbixHistoryPush(apiUrl, authValue, dataRows) {
  if (!dataRows?.length) return { processed: 0 };
  const url = normalizeZabbixApiUrl(apiUrl);
  return zabbixJsonRpc(url, buildJsonRpcBody('history.push', { data: dataRows }, authValue));
}

export async function zabbixHostList(apiUrl, authValue) {
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
      authValue
    )
  );
}

export async function zabbixItemGetByHostAndKey(apiUrl, authValue, hostid, key_) {
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
      authValue
    )
  );
  return Array.isArray(rows) ? rows : [];
}

export async function zabbixItemCreateTrapper(apiUrl, authValue, params) {
  const url = normalizeZabbixApiUrl(apiUrl);
  return zabbixJsonRpc(url, buildJsonRpcBody('item.create', [params], authValue));
}
