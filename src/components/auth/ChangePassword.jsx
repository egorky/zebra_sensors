import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock } from 'lucide-react';

const ChangePassword = () => {
  const { changePassword, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setBusy(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (!result.ok) {
        setError(result.error || 'No se pudo actualizar la contraseña');
        return;
      }
      navigate('/', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-8 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-amber-200">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Lock size={24} className="text-amber-600" />
          Cambiar contraseña
        </h1>
        {mustChangePassword ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-6">
            Debes elegir una nueva contraseña (mínimo 8 caracteres) antes de continuar. Es el acceso inicial del administrador creado por el servidor.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-6">Actualiza tu contraseña de acceso al sistema.</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Contraseña actual</span>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              autoComplete="current-password"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Nueva contraseña</span>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-700 font-medium">Confirmar nueva contraseña</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              autoComplete="new-password"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
