import React, { useState, useEffect, useCallback } from 'react';
import { Users as UsersIcon, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { isBackendConfigured, fetchBackendUsers, createBackendUser, deleteBackendUser } from '../../services/backendApi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('operator');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!isBackendConfigured()) {
      setError('Define VITE_BACKEND_URL en el front y arranca el servidor API para gestionar usuarios en SQLite.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchBackendUsers();
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!newUsername.trim() || !newPassword) {
      setError('Usuario y contraseña obligatorios.');
      return;
    }
    setSubmitting(true);
    try {
      await createBackendUser({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      });
      setMessage('Usuario creado.');
      setNewUsername('');
      setNewPassword('');
      setNewRole('operator');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario? No se puede deshacer.')) return;
    setError('');
    setMessage('');
    try {
      await deleteBackendUser(id);
      setMessage('Usuario eliminado.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!isBackendConfigured()) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UsersIcon size={32} /> Usuarios (SQLite)
        </h1>
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg flex gap-2">
          <AlertTriangle size={22} className="shrink-0 mt-0.5" />
          <p>
            El backend con SQLite no está configurado en este despliegue. Añade <code className="bg-white px-1 rounded text-sm">VITE_BACKEND_URL</code> (por ejemplo{' '}
            <code className="bg-white px-1 rounded text-sm">http://localhost:3001</code>) en el <code className="bg-white px-1 rounded text-sm">.env</code> del front, ejecuta{' '}
            <code className="bg-white px-1 rounded text-sm">npm install</code> y <code className="bg-white px-1 rounded text-sm">npm run dev</code> dentro de <code className="bg-white px-1 rounded text-sm">server/</code>, y vuelve a cargar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <UsersIcon size={32} /> Usuarios
      </h1>
      <p className="text-gray-600 mb-6 text-sm">
        Los usuarios se guardan en la base SQLite del servidor. El primer arranque crea un administrador con las variables <code className="bg-gray-100 px-1 rounded">BOOTSTRAP_ADMIN_*</code> del servidor.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded mb-4 flex gap-2">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}
      {message && <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded mb-4">{message}</div>}

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UserPlus size={20} /> Añadir usuario
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
          <label className="md:col-span-1">
            <span className="block text-xs text-gray-600 mb-1">Usuario</span>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
              autoComplete="off"
            />
          </label>
          <label className="md:col-span-1">
            <span className="block text-xs text-gray-600 mb-1">Contraseña</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
              autoComplete="new-password"
            />
          </label>
          <label className="md:col-span-1">
            <span className="block text-xs text-gray-600 mb-1">Rol</span>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="border rounded px-3 py-2 w-full text-sm">
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50"
          >
            {submitting ? 'Creando…' : 'Crear'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-bold mb-4">Lista</h2>
        {loading ? (
          <p className="text-gray-500">Cargando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-2 px-3">ID</th>
                  <th className="text-left py-2 px-3">Usuario</th>
                  <th className="text-left py-2 px-3">Rol</th>
                  <th className="text-left py-2 px-3">Creado</th>
                  <th className="text-left py-2 px-3"> </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 px-3">{u.id}</td>
                    <td className="py-2 px-3 font-medium">{u.username}</td>
                    <td className="py-2 px-3">{u.role === 'operator' ? 'Operador' : 'Administrador'}</td>
                    <td className="py-2 px-3 text-gray-600">{u.created_at}</td>
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
