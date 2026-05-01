import React, { useState, useEffect, useCallback } from 'react';
import { getSensors, enrollSensor, unenrollSensor } from '../../services/api';
import { PlusCircle, RefreshCw, AlertTriangle, ChevronRight, ChevronDown, ChevronLeft, Filter } from 'lucide-react';
import SensorDetails from './SensorDetails';
import { formatZebraTemperature } from '../../utils/zebraReadings';
import {
  SENSOR_SORT_FIELDS,
  SENSOR_DEVICE_STATUSES,
  SENSOR_TASK_STATUSES,
} from '../../constants/zebraFilters';
import { useAuth } from '../../context/AuthContext';
import { isAdminRole } from '../../constants/authRoles';
import { readBackendAuthFromStorage, syncSensorsToBackend } from '../../services/backendApi';

const Sensors = () => {
  const { role } = useAuth();
  const canManageSensors = isAdminRole(role);
  const tableCols = canManageSensors ? 8 : 7;
  const [sensors, setSensors] = useState([]);
  const [pageResponse, setPageResponse] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [textFilter, setTextFilter] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('SORT_ORDER_ASC');
  const [sortField, setSortField] = useState('SORT_FIELD_NAME');
  const [sortFieldOverride, setSortFieldOverride] = useState('');
  const [advOpen, setAdvOpen] = useState(false);
  const [filterTaskId, setFilterTaskId] = useState('');
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterSensorTaskStatuses, setFilterSensorTaskStatuses] = useState([]);
  const [filterEnrolledAfter, setFilterEnrolledAfter] = useState('');
  const [filterEnrolledBefore, setFilterEnrolledBefore] = useState('');
  const [filterExcludeLowBattery, setFilterExcludeLowBattery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [selectedSensorId, setSelectedSensorId] = useState(null);

  const handleRowClick = (sensorId) => {
    setSelectedSensorId((prevId) => (prevId === sensorId ? null : sensorId));
  };

  const toggleInList = (setter, value) => {
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const clearAdvancedFilters = () => {
    setFilterTaskId('');
    setFilterStatuses([]);
    setFilterSensorTaskStatuses([]);
    setFilterEnrolledAfter('');
    setFilterEnrolledBefore('');
    setFilterExcludeLowBattery(false);
    setSortField('SORT_FIELD_NAME');
    setSortFieldOverride('');
    setPage(0);
  };

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    setError('');
    setActionMessage('');
    try {
      const data = await getSensors({
        page,
        size: pageSize,
        text_filter: appliedFilter.trim() || undefined,
        sort_field: sortFieldOverride.trim() || sortField,
        sort_order: sortOrder,
        task_id: filterTaskId.trim() || undefined,
        statuses: filterStatuses.length ? filterStatuses : undefined,
        sensor_task_statuses: filterSensorTaskStatuses.length ? filterSensorTaskStatuses : undefined,
        enrolled_after: filterEnrolledAfter.trim() || undefined,
        enrolled_before: filterEnrolledBefore.trim() || undefined,
        exclude_low_battery: filterExcludeLowBattery ? true : undefined,
      });
      const list = data.sensors || [];
      setSensors(list);
      setPageResponse(data.page_response || null);
      if (isAdminRole(role) && readBackendAuthFromStorage()?.token && list.length) {
        syncSensorsToBackend(list).catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    appliedFilter,
    sortOrder,
    sortField,
    sortFieldOverride,
    filterTaskId,
    filterStatuses,
    filterSensorTaskStatuses,
    filterEnrolledAfter,
    filterEnrolledBefore,
    filterExcludeLowBattery,
    role,
  ]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  useEffect(() => {
    setPage(0);
  }, [
    filterTaskId,
    filterEnrolledAfter,
    filterEnrolledBefore,
    filterExcludeLowBattery,
    sortField,
    sortFieldOverride,
    sortOrder,
    filterStatuses.join(','),
    filterSensorTaskStatuses.join(','),
  ]);

  const applySearch = () => {
    setPage(0);
    setAppliedFilter(textFilter);
  };

  const totalPages = pageResponse ? Math.max(1, Number(pageResponse.total_pages) || 1) : 1;

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
      setTimeout(fetchSensors, 2000);
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
      setTimeout(fetchSensors, 2000);
    } catch (err) {
      setError(`Error al desenrolar el sensor: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestión de Sensores</h1>

      {canManageSensors && (
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
      )}

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

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold">Sensores Enrolados</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applySearch())}
              placeholder="Filtrar por nombre, MAC o serial"
              className="border rounded px-3 py-2 text-sm min-w-[200px]"
            />
            <button type="button" onClick={applySearch} className="bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium py-2 px-3 rounded text-sm">
              Buscar
            </button>
            <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="border rounded px-2 py-2 text-sm">
              {SENSOR_SORT_FIELDS.map((o) => (
                <option key={o.value} value={o.value}>
                  Ordenar: {o.label}
                </option>
              ))}
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="border rounded px-2 py-2 text-sm">
              <option value="SORT_ORDER_ASC">Orden A→Z</option>
              <option value="SORT_ORDER_DESC">Orden Z→A</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(0);
                setPageSize(Number(e.target.value));
              }}
              className="border rounded px-2 py-2 text-sm"
            >
              <option value={10}>10 / página</option>
              <option value={25}>25 / página</option>
              <option value={50}>50 / página</option>
              <option value={100}>100 / página</option>
            </select>
            <button
              type="button"
              onClick={() => setAdvOpen((o) => !o)}
              className="border border-gray-300 bg-white hover:bg-gray-50 font-medium py-2 px-3 rounded flex items-center gap-2 text-sm text-gray-800"
            >
              <Filter size={16} />
              Filtros avanzados
            </button>
            <button
              onClick={fetchSensors}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 disabled:bg-gray-400 text-sm"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refrescar
            </button>
          </div>
        </div>

        {advOpen && (
          <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm space-y-4">
            <p className="text-gray-600">
              Parámetros equivalentes a la API <code className="bg-white px-1 rounded">GET /devices/environmental-sensors</code>. Al cambiar paginación o texto
              principal se mantienen hasta que los limpies. Los valores extra de ordenación pueden no existir en tu entorno: usa el campo personalizado o la documentación OpenAPI del portal.
            </p>
            <label className="block md:col-span-2 lg:col-span-3">
              <span className="text-gray-700 font-medium">sort_field personalizado (opcional; anula el desplegable superior)</span>
              <input
                value={sortFieldOverride}
                onChange={(e) => setSortFieldOverride(e.target.value)}
                className="mt-1 border rounded px-2 py-2 w-full font-mono text-sm"
                placeholder="Ej. SORT_FIELD_NAME — dejar vacío para usar el desplegable"
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-gray-700 font-medium">task_id (UUID)</span>
                <input
                  value={filterTaskId}
                  onChange={(e) => setFilterTaskId(e.target.value)}
                  className="mt-1 border rounded px-2 py-2 w-full"
                  placeholder="Opcional"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-gray-700 font-medium">enrolled_after / enrolled_before (ISO 8601, Zulu)</span>
                <div className="flex gap-2 mt-1">
                  <input
                    value={filterEnrolledAfter}
                    onChange={(e) => setFilterEnrolledAfter(e.target.value)}
                    className="border rounded px-2 py-2 flex-1"
                    placeholder="2024-01-01T00:00:00.000000Z"
                  />
                  <input
                    value={filterEnrolledBefore}
                    onChange={(e) => setFilterEnrolledBefore(e.target.value)}
                    className="border rounded px-2 py-2 flex-1"
                    placeholder="2024-12-31T23:59:59.999999Z"
                  />
                </div>
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterExcludeLowBattery}
                onChange={(e) => setFilterExcludeLowBattery(e.target.checked)}
              />
              <span>Excluir sensores con batería baja (≤ 5 %)</span>
            </label>
            <div>
              <span className="font-medium text-gray-700 block mb-2">statuses (sensor)</span>
              <div className="flex flex-wrap gap-3">
                {SENSOR_DEVICE_STATUSES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterStatuses.includes(value)}
                      onChange={() => toggleInList(setFilterStatuses, value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700 block mb-2">sensor_task_statuses (con task_id)</span>
              <div className="flex flex-wrap gap-3">
                {SENSOR_TASK_STATUSES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterSensorTaskStatuses.includes(value)}
                      onChange={() => toggleInList(setFilterSensorTaskStatuses, value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="button" onClick={clearAdvancedFilters} className="text-red-700 underline text-sm">
              Limpiar filtros avanzados
            </button>
          </div>
        )}

        {pageResponse && (
          <p className="text-sm text-gray-600 mb-3">
            Página {Number(pageResponse.page) + 1} de {totalPages} — {pageResponse.total_elements} sensores en total
          </p>
        )}

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex items-center gap-1 px-3 py-2 rounded border text-sm disabled:opacity-40"
          >
            <ChevronLeft size={18} /> Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded border text-sm disabled:opacity-40"
          >
            Siguiente <ChevronRight size={18} />
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
                <th className="py-2 px-4 border-b text-left">Última temp.</th>
                <th className="py-2 px-4 border-b text-left">Batería</th>
                {canManageSensors && <th className="py-2 px-4 border-b text-left">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {!loading && sensors.length === 0 ? (
                <tr>
                  <td colSpan={tableCols} className="py-4 px-4 text-center text-gray-500">
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
                      <td className="py-2 px-4 border-b">{formatZebraTemperature(sensor.unverified?.last_temperature)}</td>
                      <td className="py-2 px-4 border-b">{sensor.battery_level}%</td>
                      {canManageSensors && (
                        <td className="py-2 px-4 border-b">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnenroll(sensor.serial_number);
                            }}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm disabled:bg-red-300"
                            disabled={loading}
                          >
                            Desenrolar
                          </button>
                        </td>
                      )}
                    </tr>
                    {selectedSensorId === sensor.id && (
                      <tr>
                        <td colSpan={tableCols} className="p-4 bg-gray-50 border-b">
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
