import React, { useState, useEffect, useCallback } from 'react';
import { getTaskDetails, stopTask, getSensors, associateSensorToTask, getTaskData, getTaskAlarms } from '../../services/api';
import { StopCircle, Plus, Download, AlertTriangle, BellRing } from 'lucide-react';

const DetailItem = ({ label, value }) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  // Special handling for boolean values to display 'Sí' or 'No'
  if (typeof value === 'boolean') {
    value = value ? 'Sí' : 'No';
  }
  return (
    <div>
      <dt className="font-medium text-gray-600">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{String(value)}</dd>
    </div>
  );
};

const TaskDetails = ({ taskId, cachedData, onDetailUpdate }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [availableSensors, setAvailableSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState('');

  const taskData = cachedData?.data;
  const taskAlarms = cachedData?.alarms;

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    setActionMessage('');
    try {
      const data = await getTaskDetails(taskId);
      setDetails(data.task);

      const sensorsData = await getSensors();
      // Per user request, all sensors should be available for association.
      setAvailableSensors(sensorsData.sensors);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleStopTask = async () => {
    if (!window.confirm('¿Estás seguro de que quieres detener esta tarea?')) return;
    setLoading(true);
    try {
      await stopTask(taskId);
      setActionMessage('Tarea detenida con éxito.');
      fetchDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractAlarms = async () => {
    if (taskAlarms) return; // Don't re-fetch if already cached
    setLoading(true);
    try {
      const data = await getTaskAlarms(taskId);
      onDetailUpdate(taskId, 'alarms', data);
      setActionMessage('Alarmas extraídas con éxito.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateSensor = async (e) => {
    e.preventDefault();
    if (!selectedSensor) return;
    setLoading(true);
    try {
      await associateSensorToTask(taskId, selectedSensor);
      setActionMessage('Sensor asociado con éxito.');
      setSelectedSensor('');
      fetchDetails(); // Refresh details
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractData = async () => {
    if (taskData) return; // Don't re-fetch if already cached
    setLoading(true);
    try {
      const data = await getTaskData(taskId);
      onDetailUpdate(taskId, 'data', data);
      setActionMessage('Datos extraídos con éxito.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !details) return <p>Cargando detalles de la tarea...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!details) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2" role="alert">
          <AlertTriangle size={20} />
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {actionMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          {actionMessage}
        </div>
      )}

      {/* --- Task Details --- */}
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

        {/* Sensor Status Overview */}
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

        {/* Alarm Configuration */}
        <div className="mt-4">
          <h4 className="font-semibold text-gray-700">Configuración de Alarmas</h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-2">
            <DetailItem label="Temp. Mínima" value={`${details.taskDetails.alarm_low_temp}°`} />
            <DetailItem label="Temp. Máxima" value={`${details.taskDetails.alarm_high_temp}°`} />
            <DetailItem label="Duración Alarma Baja" value={`${details.taskDetails.low_duration_minutes}m ${details.taskDetails.low_duration_seconds}s`} />
            <DetailItem label="Duración Alarma Alta" value={`${details.taskDetails.high_duration_minutes}m ${details.taskDetails.high_duration_seconds}s`} />
          </dl>
        </div>

        {/* Interval and Start Configuration */}
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

      {/* --- Actions --- */}
      <div className="flex flex-wrap gap-4 items-center">
        <button onClick={handleStopTask} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
          <StopCircle size={20} /> Detener Tarea
        </button>
        <button onClick={handleExtractData} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
          <Download size={20} /> Extraer Datos
        </button>
        <button onClick={handleExtractAlarms} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
          <BellRing size={20} /> Extraer Alarmas
        </button>
      </div>

      {/* --- Associate Sensor --- */}
      <form onSubmit={handleAssociateSensor} className="flex items-center gap-4 mt-4">
        <select value={selectedSensor} onChange={(e) => setSelectedSensor(e.target.value)} className="shadow border rounded w-full py-2 px-3">
          <option value="">Selecciona un sensor disponible</option>
          {availableSensors.map(s => <option key={s.id} value={s.id}>{s.name} ({s.serial_number})</option>)}
        </select>
        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
          <Plus size={20} /> Asociar Sensor
        </button>
      </form>

      {/* --- Task Data --- */}
      {taskData && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Datos de la Tarea</h3>
          <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(taskData, null, 2)}
          </pre>
        </div>
      )}

      {/* --- Task Alarms --- */}
      {taskAlarms && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Alarmas de la Tarea</h3>
          <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(taskAlarms, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
