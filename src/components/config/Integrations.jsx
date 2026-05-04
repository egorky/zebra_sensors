import React, { useEffect, useState } from 'react';
import {
  fetchIntegrationSettings,
  updateIntegrationSettings,
  testZabbixIntegration,
  runPollerNow,
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
  const [runs, setRuns] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { settings } = await fetchIntegrationSettings();
      setForm((f) => ({
        ...f,
        poller_enabled: !!settings.poller_enabled,
        poll_interval_minutes: settings.poll_interval_minutes || 6,
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
      const r = await fetchPollerRuns().catch(() => ({ runs: [] }));
      setRuns(r.runs || []);
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
        zabbix_api_url: form.zabbix_api_url.trim(),
        zabbix_auth_type: form.zabbix_auth_type,
        zabbix_username: form.zabbix_username.trim(),
        item_key_template: form.item_key_template.trim(),
        min_seconds_between_events: Number(form.min_seconds_between_events) || 0,
        initial_lookback_minutes: Number(form.initial_lookback_minutes) || 120,
        zabbix_hosts: textToHosts(form.zabbix_hosts_text),
      };
      if (form.zabbix_api_token.trim()) payload.zabbix_api_token = form.zabbix_api_token.trim();
      if (form.zabbix_password.trim()) payload.zabbix_password = form.zabbix_password.trim();

      const { settings } = await updateIntegrationSettings(payload);
      setMeta({
        last_poll_at: settings.last_poll_at,
        last_poll_error: settings.last_poll_error,
      });
      setMessage('Guardado.');
      setTimeout(() => setMessage(''), 4000);
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

  if (loading) {
    return <p className="text-gray-600">Cargando…</p>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-0 space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Integración Zabbix y polling Zebra</h1>
      <p className="text-gray-600 text-sm sm:text-base">
        El servidor consulta el log de las tareas de Zebra que tengas activadas en <strong>Tareas</strong> y envía valores a Zabbix mediante la API JSON-RPC (
        <code className="bg-gray-100 px-1 rounded">history.push</code>
        , Zabbix 7+). Los cursores, el historial de ejecuciones, el último evento por sensor y las políticas por tarea se guardan en la base de datos de esta aplicación (
        <code className="bg-gray-100 px-1 rounded">zebra_poll_runs</code>, <code className="bg-gray-100 px-1 rounded">zebra_poll_cursors</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">zebra_poll_sensor_state</code>, <code className="bg-gray-100 px-1 rounded">zebra_poll_sensor_policy</code>).
      </p>
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
      {message ? <p className="text-green-700 text-sm">{message}</p> : null}

      <form onSubmit={onSubmit} className="bg-white p-4 sm:p-8 rounded-lg shadow-md space-y-6">
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
            Cada cuántos minutos el servidor vuelve a pedir el log a Zebra para cada tarea con polling activo y puede enviar datos a Zabbix. Se reaplica al guardar esta página.
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
          <p className="text-xs text-gray-500 mt-1">Equivale a ejecutar history.push por cada host (como varios zabbix_sender).</p>
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
            Usa <code className="bg-gray-100 px-1">{'{sensorId}'}</code> para el id del sensor en el evento (p. ej. alarm.{'{sensorId}'}). Debe coincidir con los ítems creados desde Sensores.
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
          <p className="text-xs text-gray-500 mt-1">Por ejemplo 300 = 5 minutos entre envíos del mismo sensor.</p>
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-5 text-sm text-amber-950">
        <p className="font-semibold mb-1">Tareas y sensores</p>
        <p>
          Activa el polling por tarea y el envío por sensor en <strong>Tareas</strong> (detalle de cada tarea). Esta pantalla define Zabbix, intervalo global y plantillas; la API de Zebra viene de <strong>Configuración</strong> (o variables de entorno del servidor).
        </p>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md text-sm text-gray-700">
        <p>
          <strong>Último poll:</strong> {meta.last_poll_at ? String(meta.last_poll_at) : '—'}
        </p>
        {meta.last_poll_error ? (
          <p className="text-red-600 mt-2">
            <strong>Error:</strong> {meta.last_poll_error}
          </p>
        ) : null}
      </div>

      {runs.length ? (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-3">Últimas ejecuciones del poller</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Id</th>
                  <th className="py-2 pr-4">Tarea</th>
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
                    <td className="py-2 pr-4 font-mono text-xs">{r.task_id != null && r.task_id !== '' ? r.task_id : '—'}</td>
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
