import React, { useState, useEffect, useCallback } from 'react';
import {
  getTaskDetails,
  stopTask,
  getSensors,
  associateSensorToTask,
  getTaskLogPage,
  getTaskAlarmsPage,
  addTaskAsset,
} from '../../services/api';
import { StopCircle, Plus, Download, AlertTriangle, BellRing, Package } from 'lucide-react';
import { formatZebraTemperature, isInvalidZebraTemperature } from '../../utils/zebraReadings';
import { useAuth } from '../../context/AuthContext';
import { canManageZebraContent } from '../../constants/authRoles';
import TaskDetailsZabbixPoll from './TaskDetailsZabbixPoll';

const ASSET_FORMAT_OPTIONS = ['ASSET_ID_FORMAT_GS1_URI'];

const DetailItem = ({ label, value }) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  let display = value;
  if (typeof value === 'boolean') {
    display = value ? 'Sí' : 'No';
  }
  return (
    <div>
      <dt className="font-medium text-gray-600">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{String(display)}</dd>
    </div>
  );
};

function flattenLogRows(payload) {
  if (!payload?.results || !Array.isArray(payload.results)) return [];
  return payload.results.map((row) => {
    const ev = row.event || row;
    const ts = ev.timestamp ?? ev.analytics?.recordedTimestamp;
    const sample = ev.decode?.temperature?.sample;
    const alert = ev.decode?.temperature?.alert;
    return { ts, sample, alert, id: ev.id };
  });
}

const TaskDetails = ({ taskId, cachedData, onDetailUpdate }) => {
  const { role, isAdmin } = useAuth();
  const canManageTask = canManageZebraContent(role);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [loadingLog, setLoadingLog] = useState(false);
  const [loadingAlarms, setLoadingAlarms] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  const [availableSensors, setAvailableSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState('');

  const logState = cachedData?.data ?? null;
  const alarmState = cachedData?.alarms ?? null;

  const [logLimit, setLogLimit] = useState(100);
  const [logStart, setLogStart] = useState('');
  const [logEnd, setLogEnd] = useState('');
  const [logSensorTaskId, setLogSensorTaskId] = useState('');
  const [logDeviceId, setLogDeviceId] = useState('');

  const [assetValue, setAssetValue] = useState('');
  const [assetFormat, setAssetFormat] = useState(ASSET_FORMAT_OPTIONS[0]);

  const fetchDetails = useCallback(async () => {
    setLoadingDetails(true);
    setLoadError('');
    setBannerError('');
    setActionMessage('');
    try {
      const data = await getTaskDetails(taskId);
      setDetails(data.task);

      if (canManageTask) {
        const sensorsData = await getSensors({ page: 0, size: 500, sort_order: 'SORT_ORDER_ASC' });
        setAvailableSensors(sensorsData.sensors || []);
      } else {
        setAvailableSensors([]);
      }
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  }, [taskId, canManageTask]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleStopTask = async () => {
    if (!window.confirm('¿Estás seguro de que quieres detener esta tarea?')) return;
    setBannerError('');
    setLoadingDetails(true);
    try {
      await stopTask(taskId);
      setActionMessage('Tarea detenida con éxito.');
      await fetchDetails();
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const logFilters = () => ({
    startTime: logStart.trim() || undefined,
    endTime: logEnd.trim() || undefined,
    sensorTaskId: logSensorTaskId.trim() || undefined,
    deviceId: logDeviceId.trim() || undefined,
  });

  const handleLoadLogFirstPage = async () => {
    setBannerError('');
    setLoadingLog(true);
    try {
      const raw = await getTaskLogPage(taskId, {
        limit: Math.min(14000, Math.max(1, Number(logLimit) || 100)),
        ...logFilters(),
      });
      const rows = flattenLogRows(raw);
      onDetailUpdate(taskId, 'data', {
        mergedRows: rows,
        rawPages: [raw],
        nextCursor: raw.nextCursor || null,
        limit: Math.min(14000, Math.max(1, Number(logLimit) || 100)),
        filters: logFilters(),
      });
      setActionMessage('Primera página del log cargada.');
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setLoadingLog(false);
    }
  };

  const handleLoadMoreLog = async () => {
    if (!logState?.nextCursor) return;
    setBannerError('');
    setLoadingLog(true);
    try {
      const raw = await getTaskLogPage(taskId, {
        limit: logState.limit,
        cursor: logState.nextCursor,
        ...logState.filters,
      });
      const newRows = flattenLogRows(raw);
      onDetailUpdate(taskId, 'data', {
        mergedRows: [...(logState.mergedRows || []), ...newRows],
        rawPages: [...(logState.rawPages || []), raw],
        nextCursor: raw.nextCursor || null,
        limit: logState.limit,
        filters: logState.filters,
      });
      setActionMessage('Página siguiente del log añadida.');
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setLoadingLog(false);
    }
  };

  const handleClearLog = () => {
    onDetailUpdate(taskId, 'data', null);
    setActionMessage('Vista del log limpiada.');
  };

  const handleLoadAlarmsFirstPage = async () => {
    setBannerError('');
    setLoadingAlarms(true);
    try {
      const raw = await getTaskAlarmsPage(taskId, { page: 0, pageSize: 50 });
      const pr = raw.page_response || {};
      const items = raw.sensors_alarms || [];
      const tp = Number(pr.total_pages);
      onDetailUpdate(taskId, 'alarms', {
        items,
        page: 0,
        totalPages: Number.isFinite(tp) && tp >= 1 ? tp : 1,
        pageSize: 50,
      });
      setActionMessage('Alarmas (página 1) cargadas.');
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setLoadingAlarms(false);
    }
  };

  const handleLoadMoreAlarms = async () => {
    if (!alarmState || alarmState.page + 1 >= alarmState.totalPages) return;
    const next = alarmState.page + 1;
    setBannerError('');
    setLoadingAlarms(true);
    try {
      const raw = await getTaskAlarmsPage(taskId, { page: next, pageSize: alarmState.pageSize });
      const pr = raw.page_response || {};
      const batch = raw.sensors_alarms || [];
      const tp = Number(pr.total_pages);
      const totalPages =
        Number.isFinite(tp) && tp >= 1 ? tp : alarmState.totalPages;
      onDetailUpdate(taskId, 'alarms', {
        items: [...(alarmState.items || []), ...batch],
        page: next,
        totalPages,
        pageSize: alarmState.pageSize,
      });
      setActionMessage(`Alarmas hasta la página ${next + 1}.`);
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setLoadingAlarms(false);
    }
  };

  const handleClearAlarms = () => {
    onDetailUpdate(taskId, 'alarms', null);
    setActionMessage('Vista de alarmas limpiada.');
  };

  const handleAssociateSensor = async (e) => {
    e.preventDefault();
    if (!selectedSensor) return;
    setBannerError('');
    setLoadingDetails(true);
    try {
      await associateSensorToTask(taskId, selectedSensor);
      setActionMessage('Sensor asociado con éxito.');
      setSelectedSensor('');
      await fetchDetails();
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!assetValue.trim()) {
      setBannerError('Introduce un identificador de activo.');
      return;
    }
    setBannerError('');
    setLoadingAsset(true);
    try {
      await addTaskAsset(taskId, { asset: assetValue.trim(), id_format: assetFormat });
      setActionMessage('Activo añadido a la tarea.');
      setAssetValue('');
      await fetchDetails();
    } catch (err) {
      setBannerError(err.message);
    } finally {
      setLoadingAsset(false);
    }
  };

  if (loadingDetails && !details) return <p>Cargando detalles de la tarea...</p>;
  if (!details && loadError) return <p className="text-red-500">{loadError}</p>;
  if (!details) return null;

  const alarmHasMore = alarmState && alarmState.page + 1 < alarmState.totalPages;

  return (
    <div className="space-y-6">
      {bannerError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center gap-2" role="alert">
          <AlertTriangle size={20} />
          <span className="block sm:inline">{bannerError}</span>
        </div>
      )}
      {actionMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          {actionMessage}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Detalles de la Tarea</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <DetailItem label="ID de Tarea" value={details.id} />
          <DetailItem label="Nombre" value={details.taskDetails.name} />
          <DetailItem label="Estado General" value={details.status} />
          <DetailItem label="Sensores Requeridos" value={details.taskDetails.required_sensors} />
          <DetailItem label="Sensores Asociados" value={details.sensor_count} />
          <DetailItem label="Total de Alarmas" value={details.alarm_count} />
          <DetailItem label="Creada" value={new Date(details.taskDetails.created).toLocaleString()} />
          <DetailItem label="Actualizada" value={new Date(details.taskDetails.updated).toLocaleString()} />
          <DetailItem label="Iniciada" value={details.started ? new Date(details.started).toLocaleString() : 'N/A'} />
          <DetailItem label="Finalizada" value={details.ended ? new Date(details.ended).toLocaleString() : 'N/A'} />
          <DetailItem label="Tipo de Sensor" value={details.taskDetails.sensor_type} />
          <DetailItem label="Notas" value={details.taskDetails.notes} />
        </dl>

        {details.sensor_task_status_overview && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-700">Estado de Sensores en Tarea</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-2">
              <DetailItem label="Activos" value={details.sensor_task_status_overview.active} />
              <DetailItem label="Activos con Alarma" value={details.sensor_task_status_overview.active_with_alarm} />
              <DetailItem label="Completados" value={details.sensor_task_status_overview.completed} />
              <DetailItem label="Inicio Pendiente" value={details.sensor_task_status_overview.start_pending} />
              <DetailItem label="Parada Pendiente" value={details.sensor_task_status_overview.stop_pending} />
            </dl>
          </div>
        )}

        <div className="mt-4">
          <h4 className="font-semibold text-gray-700">Configuración de Alarmas</h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-2">
            <DetailItem label="Temp. Mínima" value={`${details.taskDetails.alarm_low_temp}°`} />
            <DetailItem label="Temp. Máxima" value={`${details.taskDetails.alarm_high_temp}°`} />
            <DetailItem label="Duración Alarma Baja" value={`${details.taskDetails.low_duration_minutes}m ${details.taskDetails.low_duration_seconds}s`} />
            <DetailItem label="Duración Alarma Alta" value={`${details.taskDetails.high_duration_minutes}m ${details.taskDetails.high_duration_seconds}s`} />
          </dl>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold text-gray-700">Configuración de Intervalo e Inicio</h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-2">
            <DetailItem label="Intervalo" value={`${details.taskDetails.interval_minutes}m ${details.taskDetails.interval_seconds}s`} />
            <DetailItem label="Lecturas en Bucle" value={details.taskDetails.loop_reads} />
            <DetailItem label="Inicio Inmediato" value={!!details.taskDetails.start_immediately} />
            {details.taskDetails.start_delayed && (
              <>
                <DetailItem label="Inicio Retrasado" value="Sí" />
                <DetailItem label="Retraso por Botón" value={details.taskDetails.start_delayed.on_button_press} />
              </>
            )}
          </dl>
        </div>
      </div>

      {isAdmin ? <TaskDetailsZabbixPoll taskId={taskId} /> : null}

      {canManageTask && (
        <div className="flex flex-wrap gap-4 items-center">
          <button
            type="button"
            onClick={handleStopTask}
            disabled={loadingDetails}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50"
          >
            <StopCircle size={20} /> Detener Tarea
          </button>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Download size={18} /> Log de datos (paginado por cursor)
        </h4>
        <p className="text-sm text-gray-600">
          Usa el cursor devuelto por la API para cargar más eventos. Límite por petición entre 1 y 14000 según la documentación del servicio.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Límite</span>
            <input
              type="number"
              min={1}
              max={14000}
              value={logLimit}
              onChange={(e) => setLogLimit(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block text-gray-600 mb-1">startTime (ISO Zulu)</span>
            <input value={logStart} onChange={(e) => setLogStart(e.target.value)} className="border rounded px-2 py-1 w-full text-sm" placeholder="Opcional" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block text-gray-600 mb-1">endTime (ISO Zulu)</span>
            <input value={logEnd} onChange={(e) => setLogEnd(e.target.value)} className="border rounded px-2 py-1 w-full text-sm" placeholder="Opcional" />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">sensorTaskId</span>
            <input value={logSensorTaskId} onChange={(e) => setLogSensorTaskId(e.target.value)} className="border rounded px-2 py-1 w-full text-sm" placeholder="Opcional" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block text-gray-600 mb-1">deviceId</span>
            <input value={logDeviceId} onChange={(e) => setLogDeviceId(e.target.value)} className="border rounded px-2 py-1 w-full text-sm" placeholder="Opcional" />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoadLogFirstPage}
            disabled={loadingLog}
            className="bg-purple-600 hover:bg-purple-800 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50"
          >
            Cargar primera página
          </button>
          <button
            type="button"
            onClick={handleLoadMoreLog}
            disabled={loadingLog || !logState?.nextCursor}
            className="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50"
          >
            Cargar más (cursor)
          </button>
          <button type="button" onClick={handleClearLog} className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded text-sm">
            Limpiar vista
          </button>
        </div>
        {logState?.mergedRows?.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-700 mb-2">
              Eventos mostrados: {logState.mergedRows.length}.{' '}
              {logState.nextCursor ? 'Hay más páginas disponibles.' : 'No hay más páginas con el cursor actual.'}
            </p>
            <div className="overflow-x-auto max-h-72 overflow-y-auto border rounded bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-2">Marca de tiempo</th>
                    <th className="text-left py-2 px-2">Temperatura</th>
                    <th className="text-left py-2 px-2">Alarma</th>
                  </tr>
                </thead>
                <tbody>
                  {logState.mergedRows.map((row, idx) => (
                    <tr key={`${row.id}-${idx}`} className="border-t">
                      <td className="py-1 px-2 whitespace-nowrap">{row.ts != null ? String(row.ts) : '—'}</td>
                      <td className={`py-1 px-2 ${isInvalidZebraTemperature(row.sample) ? 'text-amber-700 font-medium' : ''}`}>
                        {formatZebraTemperature(row.sample)}
                      </td>
                      <td className="py-1 px-2">{row.alert ? 'Sí' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-blue-700">JSON bruto (última página)</summary>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto mt-2 max-h-48 overflow-y-auto">
                {JSON.stringify(logState.rawPages?.[logState.rawPages.length - 1], null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <BellRing size={18} /> Alarmas (paginación por página)
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoadAlarmsFirstPage}
            disabled={loadingAlarms}
            className="bg-yellow-600 hover:bg-yellow-800 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50"
          >
            Cargar página 1
          </button>
          <button
            type="button"
            onClick={handleLoadMoreAlarms}
            disabled={loadingAlarms || !alarmHasMore}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50"
          >
            Siguiente página
          </button>
          <button type="button" onClick={handleClearAlarms} className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 px-4 rounded text-sm">
            Limpiar vista
          </button>
        </div>
        {alarmState?.items?.length > 0 && (
          <div className="overflow-x-auto max-h-72 overflow-y-auto border rounded bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-2">Fecha</th>
                  <th className="text-left py-2 px-2">Sensor</th>
                  <th className="text-left py-2 px-2">Tipo</th>
                  <th className="text-left py-2 px-2">Temperatura</th>
                </tr>
              </thead>
              <tbody>
                {alarmState.items.map((a, idx) => (
                  <tr key={`${a.sensor_id}-${a.occurred}-${idx}`} className="border-t">
                    <td className="py-1 px-2 whitespace-nowrap">{a.occurred ? new Date(a.occurred).toLocaleString() : '—'}</td>
                    <td className="py-1 px-2">{a.sensor_name}</td>
                    <td className="py-1 px-2">{a.alarm_type}</td>
                    <td className={`py-1 px-2 ${isInvalidZebraTemperature(a.temperature) ? 'text-amber-700 font-medium' : ''}`}>
                      {formatZebraTemperature(a.temperature)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canManageTask && (
        <form onSubmit={handleAddAsset} className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Package size={18} /> Añadir activo a la tarea
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            Vincula un <strong>activo logístico</strong> (unidad de carga, producto, contenedor, etc.) a la tarea de monitorización para que Zebra lo asocie al
            seguimiento de temperatura. El identificador suele ser un código <strong>GS1</strong> (por ejemplo un GTIN o una URI GS1 digital link) según tu
            proceso; en esta pantalla solo está el formato <code className="bg-gray-100 px-1 rounded text-xs">ASSET_ID_FORMAT_GS1_URI</code> admitido por la
            API. Consulta la documentación de gestión Zebra si tu tenant usa otros <code className="bg-gray-100 px-1 rounded text-xs">id_format</code>.
          </p>
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <label className="flex-1 text-sm">
              <span className="block text-gray-600 mb-1">Identificador del activo</span>
              <input
                value={assetValue}
                onChange={(e) => setAssetValue(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                placeholder="Ej. cadena GS1 / URI según tu modelo"
              />
            </label>
            <label className="text-sm w-full md:w-56">
              <span className="block text-gray-600 mb-1">id_format</span>
              <select value={assetFormat} onChange={(e) => setAssetFormat(e.target.value)} className="border rounded px-2 py-2 w-full">
                {ASSET_FORMAT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={loadingAsset}
              className="bg-indigo-600 hover:bg-indigo-800 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              Añadir activo
            </button>
          </div>
        </form>
      )}

      {canManageTask && (
        <form onSubmit={handleAssociateSensor} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <select value={selectedSensor} onChange={(e) => setSelectedSensor(e.target.value)} className="shadow border rounded w-full py-2 px-3 flex-1">
            <option value="">Selecciona un sensor disponible</option>
            {availableSensors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.serial_number})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loadingDetails}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={20} /> Asociar sensor
          </button>
        </form>
      )}
    </div>
  );
};

export default TaskDetails;
