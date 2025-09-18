import React, { useState, useEffect, useCallback } from 'react';
import { getTaskDetails, stopTask, getSensors, associateSensorToTask, getTaskData } from '../../services/api';
import { StopCircle, Plus, Download, AlertTriangle } from 'lucide-react';

const TaskDetails = ({ taskId }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [availableSensors, setAvailableSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState('');

  const [taskData, setTaskData] = useState(null);

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
    setLoading(true);
    try {
      const data = await getTaskData(taskId);
      setTaskData(data);
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

      {/* --- Basic Details --- */}
      <div className="grid grid-cols-2 gap-4">
        <div><strong>ID de Tarea:</strong> {details.id}</div>
        <div><strong>Estado:</strong> {details.status}</div>
        <div><strong>Sensores Requeridos:</strong> {details.taskDetails.required_sensors}</div>
        <div><strong>Sensores Asociados:</strong> {details.sensor_count}</div>
      </div>

      {/* --- Actions --- */}
      <div className="flex flex-wrap gap-4 items-center">
        <button onClick={handleStopTask} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
          <StopCircle size={20} /> Detener Tarea
        </button>
        <button onClick={handleExtractData} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2">
          <Download size={20} /> Extraer Datos
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
    </div>
  );
};

export default TaskDetails;
