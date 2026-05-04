import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Radio, ClipboardList, Home, LogOut, HelpCircle, UserCog, UploadCloud, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getConfig, CONFIG_UPDATED_EVENT } from '../../services/api';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, isAdmin, username, role, mustChangePassword } = useAuth();
  const [logoDataUrl, setLogoDataUrl] = useState(() => getConfig().logoDataUrl || '');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const syncLogo = () => setLogoDataUrl(getConfig().logoDataUrl || '');
    syncLogo();
    window.addEventListener(CONFIG_UPDATED_EVENT, syncLogo);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, syncLogo);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const close = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

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

  const sidebarInner = (
    <>
      <div className="px-4 sm:px-6 mb-6 flex items-start justify-between gap-2 lg:block">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600 flex flex-wrap items-center gap-2 sm:gap-3">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="" className="max-h-9 max-w-[min(200px,50vw)] object-contain shrink-0" />
            ) : (
              <Radio size={26} className="shrink-0" aria-hidden />
            )}
            <span className="leading-tight">Zebra Sensor Manager</span>
          </h1>
          <p className={`text-xs sm:text-sm text-gray-500 mt-1 ${logoDataUrl ? '' : 'sm:ml-9'}`}>Gestor de Sensores Zebra</p>
        </div>
        <button
          type="button"
          className="lg:hidden shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Cerrar menú"
          onClick={() => setNavOpen(false)}
        >
          <X size={22} />
        </button>
      </div>

      <nav className="flex-grow px-2 sm:px-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const linkClasses = `
            flex items-center py-3 px-3 sm:px-6 text-gray-700 no-underline transition-all duration-200 rounded-lg lg:rounded-none
            border-r-0 lg:border-r-4 ${active ? 'lg:border-blue-600 bg-blue-50 text-blue-700 lg:bg-blue-50' : 'lg:border-transparent'}
            hover:bg-gray-100
          `;
          const textClasses = `font-medium text-sm ${active ? 'font-semibold' : ''}`;

          return (
            <Link key={item.path} to={item.path} className={linkClasses} onClick={() => setNavOpen(false)}>
              <Icon size={20} className="mr-3 shrink-0" />
              <div className="min-w-0">
                <div className={textClasses}>{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {isAuthenticated && (
        <div className="px-4 sm:px-6 pb-2 text-xs text-gray-500">
          {username ? <span className="font-medium text-gray-700">{username} · </span> : null}
          <span>{role === 'operator' ? 'Operador' : 'Administrador'}</span>
        </div>
      )}
      {isAuthenticated && !mustChangePassword && (
        <div className="px-4 sm:px-6 pb-2">
          <Link to="/change-password" className="text-sm text-blue-600 hover:underline">
            Cambiar contraseña
          </Link>
        </div>
      )}
      {isAuthenticated && (
        <div className="px-4 sm:px-6 py-3">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
              setNavOpen(false);
            }}
            className="flex items-center w-full py-3 px-3 sm:px-4 text-left text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            <LogOut size={20} className="mr-3 shrink-0" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      )}

      <div className="px-4 sm:px-6 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">v1.0.0 - Zebra Sensor Manager</div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Barra superior móvil */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-3 py-2.5 shadow-sm lg:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          aria-label="Abrir menú"
          aria-expanded={navOpen}
          onClick={() => setNavOpen(true)}
        >
          <Menu size={22} />
        </button>
        <span className="font-semibold text-gray-800 truncate">Zebra Sensor Manager</span>
      </header>

      {/* Overlay móvil */}
      {navOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      {/* Sidebar: drawer en móvil, fijo en escritorio */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] max-w-[320px] flex-col border-r border-gray-200 bg-white py-5 shadow-lg transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-sm',
          navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {sidebarInner}
      </aside>

      {/* Contenido */}
      <div className="flex min-h-screen flex-1 flex-col pt-14 lg:pt-0">
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
