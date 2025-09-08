import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Upload, 
  GitMerge, 
  Eye, 
  Home,
  Settings,
  Image
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio', description: 'Dashboard principal' },
    { path: '/templates', icon: MessageSquare, label: 'Plantillas', description: 'Gestionar plantillas de WhatsApp' },
    { path: '/upload', icon: Upload, label: 'Cargar Excel', description: 'Subir archivo de datos' },
    { path: '/mapping', icon: GitMerge, label: 'Mapear Campos', description: 'Configurar campos de plantilla' },
    { path: '/preview', icon: Eye, label: 'Vista Previa', description: 'Revisar mensajes antes de enviar' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '24px 0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        {/* Logo/Header */}
        <div style={{ padding: '0 24px', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#25d366',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MessageSquare size={28} />
            WhatsApp Manager
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '4px 0 0 36px'
          }}>
            Gestión de plantillas masivas
          </p>
        </div>

        {/* Navigation */}
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  color: active ? '#25d366' : '#374151',
                  backgroundColor: active ? '#f0fdf4' : 'transparent',
                  borderRight: active ? '3px solid #25d366' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.target.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={20} style={{ marginRight: '12px' }} />
                <div>
                  <div style={{ 
                    fontWeight: active ? '600' : '500',
                    fontSize: '14px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginTop: '2px'
                  }}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          right: '24px',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '16px'
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            textAlign: 'center'
          }}>
            v1.0.0 - WhatsApp Templates Manager
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <main style={{ padding: '32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
