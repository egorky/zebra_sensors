import React, { useState, useEffect, useCallback } from 'react';
import { getSensors, enrollSensor, unenrollSensor } from '../../services/api';
import { PlusCircle, RefreshCw, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';
import SensorDetails from './SensorDetails';

const Sensors = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [selectedSensorId, setSelectedSensorId] = useState(null);

  const handleRowClick = (sensorId) => {
    setSelectedSensorId(prevId => (prevId === sensorId ? null : sensorId));
  };

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    setError('');
    setActionMessage('');
    try {
      const data = await getSensors();
      setSensors(data.sensors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      setError('Por favor, introduce un número de serie.');
      return;
    }
    setLoading(true);
    setError('');
    setActionMessage('');
    try {
      await enrollSensor(serialNumber);
      setActionMessage(`Sensor ${serialNumber} enrolado con éxito. La lista se actualizará en breve.`);
      setSerialNumber('');
      setTimeout(fetchSensors, 2000); // Refresh list after a delay
    } catch (err) {
      setError(`Error al enrolar el sensor: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (sensorSerialNumber) => {
    if (!window.confirm(`¿Estás seguro de que quieres desenrolar el sensor ${sensorSerialNumber}?`)) {
      return;
    }
    setLoading(true);
    setError('');
    setActionMessage('');
    try {
      await unenrollSensor(sensorSerialNumber);
      setActionMessage(`Sensor ${sensorSerialNumber} desenrolado con éxito. La lista se actualizará en breve.`);
      setTimeout(fetchSensors, 2000); // Refresh list
    } catch (err) {
      setError(`Error al desenrolar el sensor: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestión de Sensores</h1>

      {/* Enroll Sensor Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">Enrolar Nuevo Sensor</h2>
        <form onSubmit={handleEnroll} className="flex items-center gap-4">
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Número de serie del sensor"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 disabled:bg-blue-300"
            disabled={loading}
          >
            <PlusCircle size={20} />
            Enrolar
          </button>
        </form>
      </div>

      {/* Messages */}
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

      {/* Sensor List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sensores Enrolados</h2>
          <button
            onClick={fetchSensors}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 disabled:bg-gray-400"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refrescar
          </button>
        </div>

        {loading && <p>Cargando sensores...</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b w-12"></th>
                <th className="py-2 px-4 border-b text-left">Nombre</th>
                <th className="py-2 px-4 border-b text-left">Serial Number</th>
                <th className="py-2 px-4 border-b text-left">MAC Address</th>
                <th className="py-2 px-4 border-b text-left">Estado</th>
                <th className="py-2 px-4 border-b text-left">Batería</th>
                <th className="py-2 px-4 border-b text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && sensors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                    No se encontraron sensores.
                  </td>
                </tr>
              ) : (
                sensors.map((sensor) => (
                  <React.Fragment key={sensor.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(sensor.id)}>
                      <td className="py-2 px-4 border-b text-center">
                        {selectedSensorId === sensor.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </td>
                      <td className="py-2 px-4 border-b">{sensor.name}</td>
                      <td className="py-2 px-4 border-b">{sensor.serial_number}</td>
                      <td className="py-2 px-4 border-b">{sensor.mac_address}</td>
                      <td className="py-2 px-4 border-b">{sensor.status}</td>
                      <td className="py-2 px-4 border-b">{sensor.battery_level}%</td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click from firing
                            handleUnenroll(sensor.serial_number);
                          }}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm disabled:bg-red-300"
                          disabled={loading}
                        >
                          Desenrolar
                        </button>
                      </td>
                    </tr>
                    {selectedSensorId === sensor.id && (
                      <tr>
                        <td colSpan="7" className="p-4 bg-gray-50 border-b">
                          <SensorDetails sensor={sensor} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sensors;
