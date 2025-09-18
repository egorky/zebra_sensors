import React, { useState } from 'react';
import { createTask } from '../../services/api';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [taskDetails, setTaskDetails] = useState({
    name: '',
    interval_minutes: '0',
    interval_seconds: '15',
    loop_reads: false,
    start_immediately: {},
    sensor_type: 'SENSOR_TYPE_TEMPERATURE',
    alarm_low_temp: '20',
    alarm_high_temp: '25',
    notes: '',
    low_duration_minutes: '0',
    low_duration_seconds: '30',
    high_duration_minutes: '0',
    high_duration_seconds: '30',
    required_sensors: '1'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Basic validation
      if (!taskDetails.name.trim()) {
        throw new Error('El nombre de la tarea es obligatorio.');
      }

      const payload = {
        ...taskDetails,
        // Convert number fields from string to number where necessary
        interval_minutes: parseInt(taskDetails.interval_minutes, 10),
        interval_seconds: parseInt(taskDetails.interval_seconds, 10),
        alarm_low_temp: parseFloat(taskDetails.alarm_low_temp),
        alarm_high_temp: parseFloat(taskDetails.alarm_high_temp),
        low_duration_minutes: parseInt(taskDetails.low_duration_minutes, 10),
        low_duration_seconds: parseInt(taskDetails.low_duration_seconds, 10),
        high_duration_minutes: parseInt(taskDetails.high_duration_minutes, 10),
        high_duration_seconds: parseInt(taskDetails.high_duration_seconds, 10),
        required_sensors: parseInt(taskDetails.required_sensors, 10)
      };

      await createTask(payload);
      onTaskCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Crear Nueva Tarea</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block font-bold">Nombre de la Tarea</label>
            <input type="text" name="name" value={taskDetails.name} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block font-bold">Intervalo (minutos)</label>
                <input type="number" name="interval_minutes" value={taskDetails.interval_minutes} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
                <label className="block font-bold">Intervalo (segundos)</label>
                <input type="number" name="interval_seconds" value={taskDetails.interval_seconds} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block font-bold">Alarma Temp. Baja (°C)</label>
                <input type="number" step="0.1" name="alarm_low_temp" value={taskDetails.alarm_low_temp} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
                <label className="block font-bold">Alarma Temp. Alta (°C)</label>
                <input type="number" step="0.1" name="alarm_high_temp" value={taskDetails.alarm_high_temp} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          </div>

          <div>
            <label className="block font-bold">Notas</label>
            <textarea name="notes" value={taskDetails.notes} onChange={handleChange} className="w-full p-2 border rounded"></textarea>
          </div>

          <div>
            <label className="block font-bold">Sensores Requeridos</label>
            <input type="number" name="required_sensors" value={taskDetails.required_sensors} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>

          <div className="flex items-center">
            <input type="checkbox" name="loop_reads" checked={taskDetails.loop_reads} onChange={handleChange} className="mr-2" />
            <label>Loop Reads</label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded">
              Cancelar
            </button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
