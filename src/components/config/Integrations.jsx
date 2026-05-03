import React, { useEffect, useState } from 'react';
import {
  fetchIntegrationSettings,
  updateIntegrationSettings,
  testZabbixIntegration,
  runPollerNow,
  fetchPollerSensorState,
  fetchPollerSensorPolicies,
  savePollerSensorPolicies,
  fetchPollerRuns,
} from '../../services/backendApi';

const defaultHostsText = 'Zebra Devices\nPrologitec';

function hostsToText(arr) {
  if (!Array.isArray(arr) || !arr.length) return defaultHostsText;
  return arr.join('\n');
}

function textToHosts(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const Integrations = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    poller_enabled: false,
    poll_interval_minutes: 6,
    zebra_base_url: 'https://api.zebra.com/v2',
    zebra_task_id: '',
    zebra_api_key: '',
    zabbix_api_url: '',
    zabbix_auth_type: 'token',
    zabbix_api_token: '',
    zabbix_username: '',
    zabbix_password: '',
    zabbix_hosts_text: defaultHostsText,
    item_key_template: 'alarm.{sensorId}',
    min_seconds_between_events: 300,
    initial_lookback_minutes: 120,
  });
  const [meta, setMeta] = useState({ last_poll_at: null, last_poll_error: null });
  const [sensorRows, setSensorRows] = useState([]);
  const [sensorPolicies, setSensorPolicies] = useState([]);
  const [policyBusy, setPolicyBusy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState('');
  const [runs, setRuns] = useState([]);

  const loadPoliciesForTask = async (taskId) => {
    const tid = String(taskId || '').trim();
    if (!tid) {
      setSensorPolicies([]);
      return;
    }
    setPolicyBusy(true);
    setPolicyMessage('');
    try {
      const data = await fetchPollerSensorPolicies(tid);
      setSensorPolicies(Array.isArray(data.sensors) ? data.sensors : []);
    } catch (e) {
      setSensorPolicies([]);
      setError(String(e.message || e));
    } finally {
      setPolicyBusy(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { settings } = await fetchIntegrationSettings();
      setForm((f) => ({
        ...f,
        poller_enabled: !!settings.poller_enabled,
        poll_interval_minutes: settings.poll_interval_minutes || 6,
        zebra_base_url: settings.zebra_base_url || '',
        zebra_task_id: settings.zebra_task_id || '',
        zebra_api_key: '',
        zabbix_api_url: settings.zabbix_api_url || '',
        zabbix_auth_type: settings.zabbix_auth_type || 'token',
        zabbix_api_token: '',
        zabbix_username: settings.zabbix_username || '',
        zabbix_password: '',
        zabbix_hosts_text: hostsToText(settings.zabbix_hosts),
        item_key_template: settings.item_key_template || 'alarm.{sensorId}',
        min_seconds_between_events: settings.min_seconds_between_events ?? 300,
        initial_lookback_minutes: settings.initial_lookback_minutes ?? 120,
      }));
      setMeta({
        last_poll_at: settings.last_poll_at,
        last_poll_error: settings.last_poll_error,
      });
      if (settings.zebra_task_id) {
        const st = await fetchPollerSensorState(settings.zebra_task_id).catch(() => ({ sensors: [] }));
        setSensorRows(st.sensors || []);
        await loadPoliciesForTask(settings.zebra_task_id);
        const r = await fetchPollerRuns().catch(() => ({ runs: [] }));
        setRuns(r.runs || []);
      } else {
        setSensorRows([]);
        setSensorPolicies([]);
        const r = await fetchPollerRuns().catch(() => ({ runs: [] }));
        setRuns(r.runs || []);
      }
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((p) => ({ ...p, [name]: checked }));
    } else if (name === 'poll_interval_minutes' || name === 'min_seconds_between_events' || name === 'initial_lookback_minutes') {
      setForm((p) => ({ ...p, [name]: value === '' ? '' : Number(value) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        poller_enabled: form.poller_enabled,
        poll_interval_minutes: Number(form.poll_interval_minutes) || 6,
        zebra_base_url: form.zebra_base_url.trim(),
        zebra_task_id: form.zebra_task_id.trim(),
        zabbix_api_url: form.zabbix_api_url.trim(),
        zabbix_auth_type: form.zabbix_auth_type,
        zabbix_username: form.zabbix_username.trim(),
        item_key_template: form.item_key_template.trim(),
        min_seconds_between_events: Number(form.min_seconds_between_events) || 0,
        initial_lookback_minutes: Number(form.initial_lookback_minutes) || 120,
        zabbix_hosts: textToHosts(form.zabbix_hosts_text),
      };
      if (form.zebra_api_key.trim()) payload.zebra_api_key = form.zebra_api_key.trim();
      if (form.zabbix_api_token.trim()) payload.zabbix_api_token = form.zabbix_api_token.trim();
      if (form.zabbix_password.trim()) payload.zabbix_password = form.zabbix_password.trim();

      const { settings } = await updateIntegrationSettings(payload);
      setMeta({
        last_poll_at: settings.last_poll_at,
        last_poll_error: settings.last_poll_error,
      });
      setMessage('Guardado.');
      setTimeout(() => setMessage(''), 4000);
      if (settings.zebra_task_id) {
        const st = await fetchPollerSensorState(settings.zebra_task_id).catch(() => ({ sensors: [] }));
        setSensorRows(st.sensors || []);
        await loadPoliciesForTask(settings.zebra_task_id);
      }
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const onTestZabbix = async () => {
    setMessage('');
    setError('');
    try {
      const body = {
        zabbix_api_url: form.zabbix_api_url.trim(),
        zabbix_auth_type: form.zabbix_auth_type,
        zabbix_username: form.zabbix_username.trim(),
      };
      if (form.zabbix_api_token.trim()) body.zabbix_api_token = form.zabbix_api_token.trim();
      if (form.zabbix_password.trim()) body.zabbix_password = form.zabbix_password.trim();
      const out = await testZabbixIntegration(body);
      setMessage(
        `Zabbix API ${out.version || '?'} — auth: ${out.authOk ? 'OK' : 'falló'}${out.authError ? ` (${out.authError})` : ''}`
      );
    } catch (err) {
      setError(String(err.message || err));
    }
  };

  const onRunNow = async () => {
    setMessage('');
    setError('');
    try {
      const out = await runPollerNow();
      setMessage(JSON.stringify(out));
      await load();
    } catch (err) {
      setError(String(err.message || err));
    }
  };

  const onReloadPolicies = async () => {
    setError('');
    setPolicyMessage('');
    const tid = form.zebra_task_id.trim();
    if (!tid) {
      setError('Indica el UUID de la tarea de Zebra para cargar la lista de sensores.');
      return;
    }
    await loadPoliciesForTask(tid);
    setPolicyMessage('Lista actualizada.');
    setTimeout(() => setPolicyMessage(''), 3000);
  };

  const onPolicyToggle = (sensorId, enabled) => {
    setSensorPolicies((prev) =>
      prev.map((s) => (s.sensor_zebra_id === sensorId ? { ...s, polling_enabled: enabled } : s))
    );
  };

  const onSavePolicies = async () => {
    const tid = form.zebra_task_id.trim();
    if (!tid) {
      setError('Indica el UUID de la tarea antes de guardar políticas por sensor.');
      return;
    }
    setPolicyBusy(true);
    setPolicyMessage('');
    setError('');
    try {
      await savePollerSensorPolicies(
        tid,
        sensorPolicies.map((s) => ({
          sensor_zebra_id: s.sensor_zebra_id,
          polling_enabled: !!s.polling_enabled,
        }))
      );
      setPolicyMessage('Políticas de sensores guardadas.');
      setTimeout(() => setPolicyMessage(''), 4000);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setPolicyBusy(false);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Cargando…</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Integración Zabbix y polling Zebra</h1>
      <p className="text-gray-600">
        El servidor consulta el log de la tarea de Data Reporting en Zebra y envía valores a Zabbix mediante la API JSON-RPC (
        <code className="bg-gray-100 px-1 rounded">history.push</code>
        , Zabbix 7+). Los cursores y la última lectura por sensor se guardan en la base de datos del proyecto (sustituye al flujo con Redis
        de n8n).
      </p>
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
      {message ? <p className="text-green-700 text-sm">{message}</p> : null}

      <form onSubmit={onSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Programación global del poller</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="poller_enabled" checked={form.poller_enabled} onChange={onChange} />
          <span className="font-medium">Habilitar polling automático (consultas periódicas al log de Zebra)</span>
        </label>
        <div>
          <label htmlFor="poll_interval_minutes" className="block text-gray-800 font-bold mb-1">
            Frecuencia de polling (minutos)
          </label>
          <p className="text-sm text-gray-600 mb-2">
            Cada cuántos minutos el servidor vuelve a pedir el log de la tarea a Zebra y puede enviar datos a Zabbix. Se reaplica al guardar esta página.
          </p>
          <input
            id="poll_interval_minutes"
            type="number"
            name="poll_interval_minutes"
            min={1}
            value={form.poll_interval_minutes}
            onChange={onChange}
            className="border rounded w-full max-w-xs py-2 px-3"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-1">Ventana inicial (minutos atrás, sin cursor)</label>
          <p className="text-sm text-gray-600 mb-2">Solo la primera vez o sin historial de cursor en base de datos.</p>
          <input
            type="number"
            name="initial_lookback_minutes"
            min={1}
            value={form.initial_lookback_minutes}
            onChange={onChange}
            className="border rounded w-full max-w-xs py-2 px-3"
          />
        </div>

        <h2 className="text-lg font-semibold border-b pb-2">Zebra (servidor)</h2>
        <p className="text-sm text-gray-600">
          La API key se guarda en el servidor para el poller. Si dejas el campo vacío al guardar, se conserva la clave ya almacenada.
        </p>
        <div>
          <label className="block text-gray-700 font-bold mb-1">Base URL Zebra</label>
          <input
            type="text"
            name="zebra_base_url"
            value={form.zebra_base_url}
            onChange={onChange}
            className="border rounded w-full py-2 px-3"
            placeholder="https://api.zebra.com/v2"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-1">UUID de la tarea (log)</label>
          <input
            type="text"
            name="zebra_task_id"
            value={form.zebra_task_id}
            onChange={onChange}
            className="border rounded w-full py-2 px-3 font-mono text-sm"
            placeholder="9c5e2dc1-d1fd-45b4-b310-abfbbbe89a6d"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-1">API Key Zebra</label>
          <input
            type="password"
            name="zebra_api_key"
            value={form.zebra_api_key}
            onChange={onChange}
            className="border rounded w-full py-2 px-3"
            placeholder="Dejar vacío para no cambiar la guardada"
            autoComplete="off"
          />
        </div>

        <h2 className="text-lg font-semibold border-b pb-2">Zabbix</h2>
        <div>
          <label className="block text-gray-700 font-bold mb-1">URL base del front Zabbix</label>
          <input
            type="text"
            name="zabbix_api_url"
            value={form.zabbix_api_url}
            onChange={onChange}
            className="border rounded w-full py-2 px-3"
            placeholder="https://zabbix.ejemplo.com o https://zabbix.ejemplo.com/zabbix"
          />
          <p className="text-xs text-gray-500 mt-1">Se añade automáticamente /api_jsonrpc.php si falta.</p>
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-1">Autenticación</label>
          <select
            name="zabbix_auth_type"
            value={form.zabbix_auth_type}
            onChange={onChange}
            className="border rounded w-full py-2 px-3"
          >
            <option value="token">API token</option>
            <option value="password">Usuario y contraseña</option>
          </select>
        </div>
        {form.zabbix_auth_type === 'token' ? (
          <div>
            <label className="block text-gray-700 font-bold mb-1">API token</label>
            <input
              type="password"
              name="zabbix_api_token"
              value={form.zabbix_api_token}
              onChange={onChange}
              className="border rounded w-full py-2 px-3"
              placeholder="Dejar vacío para no cambiar"
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Usuario</label>
              <input
                type="text"
                name="zabbix_username"
                value={form.zabbix_username}
                onChange={onChange}
                className="border rounded w-full py-2 px-3"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Contraseña</label>
              <input
                type="password"
                name="zabbix_password"
                value={form.zabbix_password}
                onChange={onChange}
                className="border rounded w-full py-2 px-3"
                placeholder="Dejar vacío para no cambiar"
                autoComplete="off"
              />
            </div>
          </div>
        )}
        <div>
          <label className="block text-gray-700 font-bold mb-1">Hosts Zabbix (uno por línea)</label>
          <textarea
            name="zabbix_hosts_text"
            value={form.zabbix_hosts_text}
            onChange={onChange}
            rows={3}
            className="border rounded w-full py-2 px-3 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Equivale a ejecutar history.push por cada host (como tus dos zabbix_sender).</p>
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-1">Plantilla de clave de ítem</label>
          <input
            type="text"
            name="item_key_template"
            value={form.item_key_template}
            onChange={onChange}
            className="border rounded w-full py-2 px-3 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Usa <code className="bg-gray-100 px-1">{'{sensorId}'}</code> para el id del sensor en el evento (p. ej. alarm.{'{sensorId}'}).
          </p>
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-1">Segundos mínimos entre eventos enviados (muestreo)</label>
          <input
            type="number"
            name="min_seconds_between_events"
            min={0}
            value={form.min_seconds_between_events}
            onChange={onChange}
            className="border rounded w-full py-2 px-3"
          />
          <p className="text-xs text-gray-500 mt-1">300 = 5 minutos, como en tu nodo Code de n8n.</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" onClick={onTestZabbix} className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded">
            Probar Zabbix
          </button>
          <button type="button" onClick={onRunNow} className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold py-2 px-4 rounded">
            Ejecutar poll ahora
          </button>
        </div>
      </form>

      <div className="bg-white p-8 rounded-lg shadow-md space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Por sensor: envío a Zabbix</h2>
        <p className="text-sm text-gray-600">
          Activa o pausa el envío a Zabbix por cada sensor (el log de Zebra se sigue leyendo; los sensores en pausa no generan{' '}
          <code className="bg-gray-100 px-1 rounded">history.push</code>). La lista une sensores sincronizados en la app y los ya vistos en el poll para esta tarea.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={onReloadPolicies}
            disabled={policyBusy}
            className="bg-gray-200 hover:bg-gray-300 font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {policyBusy ? 'Cargando…' : 'Recargar lista de sensores'}
          </button>
          <button
            type="button"
            onClick={onSavePolicies}
            disabled={policyBusy || !sensorPolicies.length}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            Guardar activar/pausar
          </button>
          {policyMessage ? <span className="text-sm text-green-700">{policyMessage}</span> : null}
        </div>
        {!form.zebra_task_id.trim() ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Escribe el UUID de la tarea arriba y guarda la configuración, o usa &quot;Recargar&quot; con el UUID ya escrito en el formulario.
          </p>
        ) : null}
        {sensorPolicies.length ? (
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Sensor</th>
                  <th className="py-2 px-3">Nombre</th>
                  <th className="py-2 px-3">Enviar a Zabbix</th>
                </tr>
              </thead>
              <tbody>
                {sensorPolicies.map((s) => (
                  <tr key={s.sensor_zebra_id} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-mono text-xs">{s.sensor_zebra_id}</td>
                    <td className="py-2 px-3 text-gray-700">{s.name || '—'}</td>
                    <td className="py-2 px-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!s.polling_enabled}
                          onChange={(e) => onPolicyToggle(s.sensor_zebra_id, e.target.checked)}
                        />
                        <span>{s.polling_enabled ? 'Activo' : 'Pausado'}</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : form.zebra_task_id.trim() ? (
          <p className="text-sm text-gray-500">
            No hay sensores en la lista. Sincroniza sensores desde la app (caché en servidor) o ejecuta &quot;Ejecutar poll ahora&quot; y vuelve a recargar.
          </p>
        ) : null}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md text-sm text-gray-700">
        <p>
          <strong>Último poll:</strong> {meta.last_poll_at ? String(meta.last_poll_at) : '—'}
        </p>
        {meta.last_poll_error ? (
          <p className="text-red-600 mt-2">
            <strong>Error:</strong> {meta.last_poll_error}
          </p>
        ) : null}
      </div>

      {sensorRows.length ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">Último dato por sensor (tarea actual)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Sensor</th>
                  <th className="py-2 pr-4">Evento (timestamp)</th>
                  <th className="py-2 pr-4">Valor enviado</th>
                  <th className="py-2 pr-4">Último push</th>
                </tr>
              </thead>
              <tbody>
                {sensorRows.map((r) => (
                  <tr key={r.sensor_zebra_id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono">{r.sensor_zebra_id}</td>
                    <td className="py-2 pr-4">{r.last_event_timestamp || '—'}</td>
                    <td className="py-2 pr-4">{r.last_value_text || '—'}</td>
                    <td className="py-2 pr-4">{r.last_zabbix_push_at || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {runs.length ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">Últimas ejecuciones del poller</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Id</th>
                  <th className="py-2 pr-4">Inicio</th>
                  <th className="py-2 pr-4">Fin</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Leídos / Enviados</th>
                  <th className="py-2 pr-4">Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{r.id}</td>
                    <td className="py-2 pr-4">{r.started_at != null ? String(r.started_at) : '—'}</td>
                    <td className="py-2 pr-4">{r.finished_at != null ? String(r.finished_at) : '—'}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 pr-4">
                      {r.events_fetched} / {r.events_pushed}
                    </td>
                    <td className="py-2 pr-4 text-red-600 max-w-xs truncate" title={r.error_message || ''}>
                      {r.error_message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Integrations;
