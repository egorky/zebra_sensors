import React, { useState, useEffect, useCallback } from 'react';
import { getTasks } from '../../services/api';
import { PlusCircle, RefreshCw, AlertTriangle, ChevronRight, ChevronDown, ChevronLeft, Filter } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';
import TaskDetails from './TaskDetails';
import { TASK_SORT_FIELDS, TASK_STATUSES } from '../../constants/zebraFilters';
import { useAuth } from '../../context/AuthContext';
import { canManageZebraContent } from '../../constants/authRoles';
import { readBackendAuthFromStorage, syncTasksToBackend } from '../../services/backendApi';

const Tasks = () => {
  const { role } = useAuth();
  const canManageTasks = canManageZebraContent(role);
  const [tasks, setTasks] = useState([]);
  const [pageResponse, setPageResponse] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [textFilter, setTextFilter] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('SORT_ORDER_ASC');
  const [sortField, setSortField] = useState('SORT_FIELD_NAME');
  const [sortFieldOverride, setSortFieldOverride] = useState('');
  const [advOpen, setAdvOpen] = useState(false);
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [filterTaskStatuses, setFilterTaskStatuses] = useState([]);
  const [filterSensorMac, setFilterSensorMac] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [cachedDetails, setCachedDetails] = useState({});

  const handleDetailUpdate = (taskId, detailType, data) => {
    setCachedDetails((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [detailType]: data,
      },
    }));
  };

  const toggleInList = (setter, value) => {
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const clearAdvancedFilters = () => {
    setFilterUpdatedFrom('');
    setFilterUpdatedTo('');
    setFilterTaskStatuses([]);
    setFilterSensorMac('');
    setSortField('SORT_FIELD_NAME');
    setSortFieldOverride('');
    setPage(0);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTasks({
        page,
        size: pageSize,
        text_filter: appliedFilter.trim() || undefined,
        sort_field: sortFieldOverride.trim() || sortField,
        sort_order: sortOrder,
        updated_from: filterUpdatedFrom.trim() || undefined,
        updated_to: filterUpdatedTo.trim() || undefined,
        statuses: filterTaskStatuses.length ? filterTaskStatuses : undefined,
        sensor_mac_address: filterSensorMac.trim() || undefined,
      });
      const list = data.tasks || [];
      setTasks(list);
      setPageResponse(data.page_response || null);
      if (canManageTasks && readBackendAuthFromStorage()?.token && list.length) {
        syncTasksToBackend(list).catch(() => {});
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
    filterUpdatedFrom,
    filterUpdatedTo,
    filterTaskStatuses,
    filterSensorMac,
    canManageTasks,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setPage(0);
  }, [
    filterUpdatedFrom,
    filterUpdatedTo,
    filterSensorMac,
    sortField,
    sortFieldOverride,
    sortOrder,
    filterTaskStatuses.join(','),
  ]);

  const applySearch = () => {
    setPage(0);
    setAppliedFilter(textFilter);
  };

  const totalPages = pageResponse ? Math.max(1, Number(pageResponse.total_pages) || 1) : 1;

  const handleTaskCreated = () => {
    setIsModalOpen(false);
    fetchTasks();
  };

  const handleRowClick = (taskId) => {
    setSelectedTaskId((prevId) => (prevId === taskId ? null : taskId));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Gestión de Tareas</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center gap-2" role="alert">
          <AlertTriangle size={20} />
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold">Lista de Tareas</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applySearch())}
              placeholder="Filtrar por nombre"
              className="border rounded px-3 py-2 text-sm min-w-[180px]"
            />
            <button type="button" onClick={applySearch} className="bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium py-2 px-3 rounded text-sm">
              Buscar
            </button>
            <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="border rounded px-2 py-2 text-sm">
              {TASK_SORT_FIELDS.map((o) => (
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
            {canManageTasks && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 text-sm"
              >
                <PlusCircle size={18} />
                Crear Tarea
              </button>
            )}
            <button
              type="button"
              onClick={() => setAdvOpen((o) => !o)}
              className="border border-gray-300 bg-white hover:bg-gray-50 font-medium py-2 px-3 rounded flex items-center gap-2 text-sm text-gray-800"
            >
              <Filter size={16} />
              Filtros avanzados
            </button>
            <button
              onClick={fetchTasks}
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
              Parámetros de <code className="bg-white px-1 rounded">GET /environmental/tasks</code> según la API Zebra (Postman / portal). Algunos{' '}
              <code className="bg-white px-1 rounded">sort_field</code> extra pueden no estar soportados en todos los entornos.
            </p>
            <label className="block">
              <span className="text-gray-700 font-medium">sort_field personalizado (opcional)</span>
              <input
                value={sortFieldOverride}
                onChange={(e) => setSortFieldOverride(e.target.value)}
                className="mt-1 border rounded px-2 py-2 w-full font-mono text-sm"
                placeholder="Vacío = usar desplegable superior"
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block md:col-span-2">
                <span className="text-gray-700 font-medium">updated_from / updated_to (ISO 8601)</span>
                <div className="flex gap-2 mt-1">
                  <input
                    value={filterUpdatedFrom}
                    onChange={(e) => setFilterUpdatedFrom(e.target.value)}
                    className="border rounded px-2 py-2 flex-1"
                    placeholder="Desde (Zulu)"
                  />
                  <input
                    value={filterUpdatedTo}
                    onChange={(e) => setFilterUpdatedTo(e.target.value)}
                    className="border rounded px-2 py-2 flex-1"
                    placeholder="Hasta (Zulu)"
                  />
                </div>
              </label>
              <label className="block md:col-span-2">
                <span className="text-gray-700 font-medium">sensor_mac_address</span>
                <input
                  value={filterSensorMac}
                  onChange={(e) => setFilterSensorMac(e.target.value)}
                  className="mt-1 border rounded px-2 py-2 w-full font-mono"
                  placeholder="Ej. 00074DF30F55"
                />
              </label>
            </div>
            <div>
              <span className="font-medium text-gray-700 block mb-2">statuses (tarea)</span>
              <div className="flex flex-wrap gap-3">
                {TASK_STATUSES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterTaskStatuses.includes(value)}
                      onChange={() => toggleInList(setFilterTaskStatuses, value)}
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
            Página {Number(pageResponse.page) + 1} de {totalPages} — {pageResponse.total_elements} tareas en total
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

        {loading && <p>Cargando tareas...</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b w-12"></th>
                <th className="py-2 px-4 border-b text-left">Nombre</th>
                <th className="py-2 px-4 border-b text-left">Estado</th>
                <th className="py-2 px-4 border-b text-left">Sensores</th>
                <th className="py-2 px-4 border-b text-left">Alarmas</th>
                <th className="py-2 px-4 border-b text-left">Fecha de Creación</th>
              </tr>
            </thead>
            <tbody>
              {!loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                    No se encontraron tareas.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(task.id)}>
                      <td className="py-2 px-4 border-b text-center">
                        {selectedTaskId === task.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </td>
                      <td className="py-2 px-4 border-b">{task.taskDetails.name}</td>
                      <td className="py-2 px-4 border-b">{task.status}</td>
                      <td className="py-2 px-4 border-b">{task.sensor_count}</td>
                      <td className="py-2 px-4 border-b">{task.alarm_count}</td>
                      <td className="py-2 px-4 border-b">{new Date(task.taskDetails.created).toLocaleString()}</td>
                    </tr>
                    {selectedTaskId === task.id && (
                      <tr>
                        <td colSpan="6" className="p-4 bg-gray-50">
                          <TaskDetails taskId={task.id} cachedData={cachedDetails[task.id]} onDetailUpdate={handleDetailUpdate} />
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

      {isModalOpen && canManageTasks && (
        <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskCreated={handleTaskCreated} />
      )}
    </div>
  );
};

export default Tasks;
