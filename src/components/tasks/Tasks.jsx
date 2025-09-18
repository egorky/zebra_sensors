import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, stopTask, getTaskDetails } from '../../services/api';
import { PlusCircle, RefreshCw, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal'; // Will be created next
import TaskDetails from './TaskDetails'; // Will be created next

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTasks();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskCreated = () => {
    setIsModalOpen(false);
    fetchTasks();
  };

  const handleRowClick = (taskId) => {
    setSelectedTaskId(prevId => (prevId === taskId ? null : taskId));
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Lista de Tareas</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
            >
              <PlusCircle size={20} />
              Crear Tarea
            </button>
            <button
              onClick={fetchTasks}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2 disabled:bg-gray-400"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refrescar
            </button>
          </div>
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
                          <TaskDetails taskId={task.id} />
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

      {isModalOpen && (
        <CreateTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
};

export default Tasks;
