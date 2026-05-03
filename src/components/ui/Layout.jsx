import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Radio, ClipboardList, Home, LogOut, HelpCircle, UserCog, UploadCloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getConfig, CONFIG_UPDATED_EVENT } from '../../services/api';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, isAdmin, username, role, mustChangePassword } = useAuth();
  const [logoDataUrl, setLogoDataUrl] = useState(() => getConfig().logoDataUrl || '');

  useEffect(() => {
    const syncLogo = () => setLogoDataUrl(getConfig().logoDataUrl || '');
    syncLogo();
    window.addEventListener(CONFIG_UPDATED_EVENT, syncLogo);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, syncLogo);
  }, []);

  const allNavItems = [
    { path: '/', icon: Home, label: 'Inicio', description: 'Página principal' },
    { path: '/config', icon: Settings, label: 'Configuración', description: 'API Key y Base URL' },
    { path: '/users', icon: UserCog, label: 'Usuarios', description: 'Base en el servidor', adminOnly: true },
    {
      path: '/integrations',
      icon: UploadCloud,
      label: 'Zabbix / polling',
      description: 'Zebra → Zabbix (API)',
      adminOnly: true,
    },
    { path: '/sensors', icon: Radio, label: 'Sensores', description: 'Gestionar sensores' },
    { path: '/tasks', icon: ClipboardList, label: 'Tareas', description: 'Gestionar tareas' },
    { path: '/ayuda', icon: HelpCircle, label: 'Ayuda', description: 'Guía de uso' },
  ];
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 py-6 shadow-sm flex flex-col">
        {/* Logo/Header */}
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-3">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="" className="max-h-10 max-w-[200px] object-contain" />
            ) : (
              <Radio size={28} aria-hidden />
            )}
            <span>Zebra Sensor Manager</span>
          </h1>
          <p className={`text-sm text-gray-500 ${logoDataUrl ? '' : 'ml-9'}`}>
            Gestor de Sensores Zebra
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-grow">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const linkClasses = `
              flex items-center py-3 px-6 text-gray-700 no-underline transition-all duration-200
              border-r-4 ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent'}
              hover:bg-gray-100
            `;
            const textClasses = `
              font-medium text-sm ${active ? 'font-semibold' : ''}
            `;

            return (
              <Link key={item.path} to={item.path} className={linkClasses}>
                <Icon size={20} className="mr-3" />
                <div>
                  <div className={textClasses}>{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        {isAuthenticated && (
          <div className="px-6 pb-2 text-xs text-gray-500">
            {username ? <span className="font-medium text-gray-700">{username} · </span> : null}
            <span>{role === 'operator' ? 'Operador' : 'Administrador'}</span>
          </div>
        )}
        {isAuthenticated && !mustChangePassword && (
          <div className="px-6 pb-2">
            <Link
              to="/change-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Cambiar contraseña
            </Link>
          </div>
        )}
        {isAuthenticated && (
          <div className="px-6 py-4">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center w-full py-3 px-4 text-left text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <LogOut size={20} className="mr-3" />
              <span className="font-medium text-sm">Cerrar Sesión</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            v1.0.0 - Zebra Sensor Manager
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
