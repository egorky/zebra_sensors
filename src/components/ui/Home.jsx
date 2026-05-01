import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Radio, Thermometer, Battery, Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import { getSensors, getSensorReadings, CONFIG_UPDATED_EVENT } from '../../services/api';
import { formatZebraTemperature } from '../../utils/zebraReadings';

const DASHBOARD_SENSOR_LIMIT = 30;
const HISTORY_FETCH_MAX = 12;
const HISTORY_ROWS_SHOW = 8;

function extractReadingRows(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const keys = ['readings', 'temperature_readings', 'items', 'results', 'data', 'samples', 'records'];
  for (const k of keys) {
    if (Array.isArray(payload[k])) return payload[k];
  }
  if (Array.isArray(payload)) return payload;
  return [];
}

function readingTimestamp(row) {
  if (!row || typeof row !== 'object') return '';
  return (
    row.timestamp ??
    row.time ??
    row.recorded_timestamp ??
    row.recordedTimestamp ??
    row.date_time ??
    row.dateTime ??
    row.observed ??
    row.read_at ??
    ''
  );
}

function readingTemperature(row) {
  if (!row || typeof row !== 'object') return undefined;
  if (row.temperature != null) return row.temperature;
  if (row.temp != null) return row.temp;
  if (row.sample != null) return row.sample;
  if (row.value != null) return row.value;
  if (row.reading && typeof row.reading === 'object' && row.reading.temperature != null) return row.reading.temperature;
  if (row.decode?.temperature?.sample != null) return row.decode.temperature.sample;
  return undefined;
}

const Home = () => {
  const [sensors, setSensors] = useState([]);
  const [pageInfo, setPageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [histories, setHistories] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadSensors = useCallback(async () => {
    setLoading(true);
    setError('');
    setHistories({});
    try {
      const data = await getSensors({
        page: 0,
        size: DASHBOARD_SENSOR_LIMIT,
        sort_field: 'SORT_FIELD_NAME',
        sort_order: 'SORT_ORDER_ASC',
      });
      const list = data.sensors || [];
      setSensors(list);
      setPageInfo(data.page_response || null);
    } catch (err) {
      setError(err.message);
      setSensors([]);
      setPageInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSensors();
  }, [loadSensors]);

  useEffect(() => {
    const onConfig = () => loadSensors();
    window.addEventListener(CONFIG_UPDATED_EVENT, onConfig);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, onConfig);
  }, [loadSensors]);

  useEffect(() => {
    if (!sensors.length) return;
    const subset = sensors.slice(0, HISTORY_FETCH_MAX);
    let cancelled = false;
    setHistoryLoading(true);

    (async () => {
      const updates = {};
      await Promise.all(
        subset.map(async (s) => {
          try {
            const raw = await getSensorReadings(s.id, {
              limit: 20,
              skipErrorLog: true,
            });
            const rows = extractReadingRows(raw).slice(0, HISTORY_ROWS_SHOW);
            updates[s.id] = { status: 'ok', rows, rawEmpty: rows.length === 0 };
          } catch (e) {
            updates[s.id] = { status: 'error', rows: [], message: e.message };
          }
        })
      );
      if (!cancelled) {
        setHistories((prev) => ({ ...prev, ...updates }));
        setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sensors]);

  const total = pageInfo ? Number(pageInfo.total_elements) : sensors.length;
  const activeCount = sensors.filter((s) => String(s.status || '').includes('ACTIVE') && !String(s.status).includes('STOPPED')).length;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel principal</h1>
          <p className="text-gray-600 mt-1">Resumen de sensores enrolados y lectura reciente.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadSensors()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <Link
            to="/sensors"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-50 text-sm"
          >
            Gestionar sensores <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
            <Radio size={18} /> Sensores (tenant)
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '—' : total}</p>
          <p className="text-xs text-gray-500 mt-1">Listado vía API (hasta {DASHBOARD_SENSOR_LIMIT} en esta vista)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
            <Activity size={18} /> Con estado activo
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '—' : activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">Heurística sobre el campo `status`</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
            <Thermometer size={18} /> Histórico API
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{historyLoading ? '…' : '≤' + HISTORY_FETCH_MAX}</p>
          <p className="text-xs text-gray-500 mt-1">Lecturas recientes por sensor (si el endpoint responde)</p>
        </div>
      </div>

      {loading && !sensors.length && !error ? (
        <p className="text-gray-600">Cargando sensores…</p>
      ) : !sensors.length && !error ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
          No hay sensores enrolados. Enrola uno desde <Link to="/sensors" className="text-blue-600 font-medium underline">Sensores</Link>.
        </div>
      ) : (
        <>
          {sensors.length > HISTORY_FETCH_MAX && (
            <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
              El histórico breve por API se carga solo para los primeros <strong>{HISTORY_FETCH_MAX}</strong> sensores. El resto muestra la temperatura del
              listado.
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sensors.map((s, index) => {
            const h = histories[s.id];
            const lastDt = s.unverified?.last_date_time;
            const lastTemp = s.unverified?.last_temperature;
            const fallbackRow =
              lastTemp != null || lastDt
                ? [{ _synthetic: true, timestamp: lastDt, temperature: lastTemp, label: 'Última lectura (no verificada)' }]
                : [];

            let displayRows = [];
            if (index >= HISTORY_FETCH_MAX) {
              displayRows = fallbackRow;
            } else if (h?.status === 'ok' && h.rows?.length) {
              displayRows = h.rows;
            } else if (fallbackRow.length && (h?.status === 'error' || h?.status === 'ok')) {
              displayRows = fallbackRow;
            }

            return (
              <article key={s.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/80 to-white">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{s.name}</h2>
                  <p className="text-sm text-gray-600 font-mono mt-0.5">{s.serial_number}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-gray-700">
                      <span className="text-gray-500">Estado</span> {s.status || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-700">
                      <Battery size={16} className="text-gray-500" />
                      {s.battery_level != null ? `${s.battery_level}%` : '—'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <Thermometer className="text-blue-600 shrink-0" size={28} />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Temperatura actual (última conocida)</p>
                      <p className="text-2xl font-bold text-gray-900">{formatZebraTemperature(lastTemp)}</p>
                      {lastDt && <p className="text-xs text-gray-500 mt-1">{new Date(lastDt).toLocaleString()}</p>}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Histórico breve</h3>
                  {index >= HISTORY_FETCH_MAX && (
                    <p className="text-xs text-gray-500 mb-2">Histórico por API no cargado en el panel (límite de rendimiento).</p>
                  )}
                  {!h && index < HISTORY_FETCH_MAX && <p className="text-sm text-gray-500">Cargando lecturas…</p>}
                  {h?.status === 'error' && !fallbackRow.length && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-2">
                      No se pudo obtener el endpoint de lecturas: {h.message}. Mostrando solo datos del listado de sensores si existen.
                    </p>
                  )}
                  {displayRows.length > 0 ? (
                    <div className="overflow-x-auto max-h-48 overflow-y-auto rounded border border-gray-100">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Momento</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Temp.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayRows.map((row, idx) => {
                            const ts = row._synthetic ? row.timestamp : readingTimestamp(row);
                            const temp = row._synthetic ? row.temperature : readingTemperature(row);
                            let timeLabel = '—';
                            if (row._synthetic && row.timestamp) {
                              timeLabel = new Date(row.timestamp).toLocaleString();
                            } else if (ts) {
                              const d = typeof ts === 'string' || typeof ts === 'number' ? new Date(ts) : null;
                              timeLabel = d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : String(ts);
                            }
                            return (
                              <tr key={`${s.id}-${idx}`} className="border-t border-gray-100">
                                <td className="py-1.5 px-3 text-gray-700">
                                  {row._synthetic ? (
                                    <>
                                      <span className="italic text-gray-600 text-xs block">{row.label}</span>
                                      <span className="text-sm">{timeLabel}</span>
                                    </>
                                  ) : (
                                    <span className="text-sm">{timeLabel}</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3">{formatZebraTemperature(temp)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : h?.status === 'ok' && !displayRows.length ? (
                    <p className="text-sm text-gray-500">Sin lecturas en la respuesta de la API.</p>
                  ) : null}
                </div>
              </article>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
