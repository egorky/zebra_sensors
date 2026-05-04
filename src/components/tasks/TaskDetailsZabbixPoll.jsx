import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchTaskPollStates,
  updateTaskPollState,
  fetchPollerSensorPolicies,
  savePollerSensorPolicies,
  fetchPollerSensorState,
  fetchPollerRuns,
} from '../../services/backendApi';

const TaskDetailsZabbixPoll = ({ taskId }) => {
  const [pollOn, setPollOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [sensorPolicies, setSensorPolicies] = useState([]);
  const [sensorRows, setSensorRows] = useState([]);
  const [runs, setRuns] = useState([]);

  const loadPollFlag = useCallback(async () => {
    try {
      const { tasks } = await fetchTaskPollStates();
      const row = (tasks || []).find((t) => String(t.task_zebra_id) === String(taskId));
      setPollOn(!!row?.polling_enabled);
    } catch {
      setPollOn(false);
    }
  }, [taskId]);

  const loadPolicies = useCallback(async () => {
    setBusy(true);
    setErr('');
    try {
      const data = await fetchPollerSensorPolicies(taskId);
      setSensorPolicies(Array.isArray(data.sensors) ? data.sensors : []);
      const st = await fetchPollerSensorState(taskId).catch(() => ({ sensors: [] }));
      setSensorRows(st.sensors || []);
      const r = await fetchPollerRuns().catch(() => ({ runs: [] }));
      const all = r.runs || [];
      setRuns(all.filter((row) => String(row.task_id || '') === String(taskId)));
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }, [taskId]);

  useEffect(() => {
    setMsg('');
    setErr('');
    loadPollFlag();
    loadPolicies();
  }, [taskId, loadPollFlag, loadPolicies]);

  const onToggleTaskPoll = async (enabled) => {
    setBusy(true);
    setErr('');
    try {
      await updateTaskPollState(taskId, enabled);
      setPollOn(enabled);
      setMsg(enabled ? 'Polling a Zabbix activado para esta tarea.' : 'Polling pausado para esta tarea.');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onPolicyToggle = (sensorId, enabled) => {
    setSensorPolicies((prev) =>
      prev.map((s) => (s.sensor_zebra_id === sensorId ? { ...s, polling_enabled: enabled } : s))
    );
  };

  const onSavePolicies = async () => {
    setBusy(true);
    setErr('');
    try {
      await savePollerSensorPolicies(
        taskId,
        sensorPolicies.map((s) => ({
          sensor_zebra_id: s.sensor_zebra_id,
          polling_enabled: !!s.polling_enabled,
        }))
      );
      setMsg('Políticas por sensor guardadas.');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/40 space-y-4">
      <h4 className="font-semibold text-gray-900">Zabbix y polling del log de esta tarea</h4>
      <p className="text-sm text-gray-600">
        La URL de Zabbix, la API key de Zebra y el resto de parámetros globales están en{' '}
        <strong>Integración Zabbix y polling Zebra</strong>. Aquí activas si <em>esta</em> tarea debe incluirse en el ciclo del servidor y qué sensores envían datos a Zabbix. El identificador de la tarea es el de la lista sincronizada; no hace falta copiarlo manualmente.
      </p>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={pollOn}
          disabled={busy}
          onChange={(e) => onToggleTaskPoll(e.target.checked)}
        />
        <span className="font-medium">Incluir esta tarea en el polling hacia Zabbix</span>
      </label>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={loadPolicies}
          disabled={busy}
          className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Recargar sensores
        </button>
        <button
          type="button"
          onClick={onSavePolicies}
          disabled={busy || !sensorPolicies.length}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Guardar activar/pausar por sensor
        </button>
      </div>

      {sensorPolicies.length ? (
        <div className="overflow-x-auto border rounded bg-white text-sm">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="py-2 px-2">Sensor</th>
                <th className="py-2 px-2">Nombre</th>
                <th className="py-2 px-2">Enviar a Zabbix</th>
              </tr>
            </thead>
            <tbody>
              {sensorPolicies.map((s) => (
                <tr key={s.sensor_zebra_id} className="border-t border-gray-100">
                  <td className="py-1.5 px-2 font-mono text-xs">{s.sensor_zebra_id}</td>
                  <td className="py-1.5 px-2">{s.name || '—'}</td>
                  <td className="py-1.5 px-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
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
      ) : (
        <p className="text-sm text-gray-500">Sin sensores en caché o aún no vistos en el poll; sincroniza sensores o ejecuta un poll desde Integración Zabbix.</p>
      )}

      {sensorRows.length ? (
        <div>
          <h5 className="text-sm font-semibold text-gray-800 mb-2">Último dato guardado por sensor (esta tarea)</h5>
          <div className="overflow-x-auto border rounded bg-white text-xs">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="py-1 px-2">Sensor</th>
                  <th className="py-1 px-2">Evento</th>
                  <th className="py-1 px-2">Valor</th>
                  <th className="py-1 px-2">Último push Zabbix</th>
                </tr>
              </thead>
              <tbody>
                {sensorRows.map((r) => (
                  <tr key={r.sensor_zebra_id} className="border-t">
                    <td className="py-1 px-2 font-mono">{r.sensor_zebra_id}</td>
                    <td className="py-1 px-2">{r.last_event_timestamp || '—'}</td>
                    <td className="py-1 px-2">{r.last_value_text || '—'}</td>
                    <td className="py-1 px-2">{r.last_zabbix_push_at || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {runs.length ? (
        <div>
          <h5 className="text-sm font-semibold text-gray-800 mb-2">Últimas ejecuciones del poller</h5>
          <ul className="text-xs text-gray-600 list-disc pl-4 max-h-24 overflow-y-auto">
            {runs.slice(0, 8).map((r) => (
              <li key={r.id}>
                #{r.id} {r.task_id != null && r.task_id !== '' ? `[${r.task_id}] ` : ''}
                {r.status} — {r.events_fetched}/{r.events_pushed}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default TaskDetailsZabbixPoll;
