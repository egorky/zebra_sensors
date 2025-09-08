import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Radio, ClipboardList, Home } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio', description: 'Página principal' },
    { path: '/config', icon: Settings, label: 'Configuración', description: 'API Key y Base URL' },
    { path: '/sensors', icon: Radio, label: 'Sensores', description: 'Gestionar sensores' },
    { path: '/tasks', icon: ClipboardList, label: 'Tareas', description: 'Gestionar tareas' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 py-6 shadow-sm flex flex-col">
        {/* Logo/Header */}
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Radio size={28} />
            Zebra Sensor Manager
          </h1>
          <p className="text-sm text-gray-500 ml-9">
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
