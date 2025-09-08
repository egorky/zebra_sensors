import React, { useState } from 'react';
import { Settings, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

const ConfigCheck = () => {
  const [showTokens, setShowTokens] = useState(false);
  
  const config = {
    accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: import.meta.env.VITE_WHATSAPP_API_VERSION,
    wabaId: import.meta.env.VITE_WHATSAPP_WABA_ID
  };

  const checkConfig = () => {
    const issues = [];
    
    if (!config.accessToken) issues.push('VITE_WHATSAPP_ACCESS_TOKEN no está configurado');
    if (!config.phoneNumberId) issues.push('VITE_WHATSAPP_PHONE_NUMBER_ID no está configurado');
    if (!config.apiVersion) issues.push('VITE_WHATSAPP_API_VERSION no está configurado');
    if (!config.wabaId) issues.push('VITE_WHATSAPP_WABA_ID no está configurado');
    
    return issues;
  };

  const issues = checkConfig();
  const isValid = issues.length === 0;

  const maskToken = (token) => {
    if (!token) return 'No configurado';
    if (token.length <= 8) return token;
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Configuración de API
          </h3>
          {isValid ? (
            <CheckCircle size={16} style={{ color: '#16a34a' }} />
          ) : (
            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
          )}
        </div>
        
        <button
          onClick={() => setShowTokens(!showTokens)}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            padding: '4px 8px'
          }}
        >
          {showTokens ? <EyeOff size={14} /> : <Eye size={14} />}
          {showTokens ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '150px 1fr',
          gap: '8px',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <span style={{ fontWeight: '500' }}>Access Token:</span>
          <span style={{ 
            fontFamily: 'monospace',
            color: config.accessToken ? '#16a34a' : '#ef4444'
          }}>
            {showTokens ? config.accessToken || 'No configurado' : maskToken(config.accessToken)}
          </span>
          
          <span style={{ fontWeight: '500' }}>Phone Number ID:</span>
          <span style={{ 
            fontFamily: 'monospace',
            color: config.phoneNumberId ? '#16a34a' : '#ef4444'
          }}>
            {config.phoneNumberId || 'No configurado'}
          </span>
          
          <span style={{ fontWeight: '500' }}>API Version:</span>
          <span style={{ 
            fontFamily: 'monospace',
            color: config.apiVersion ? '#16a34a' : '#ef4444'
          }}>
            {config.apiVersion || 'No configurado'}
          </span>
          
          <span style={{ fontWeight: '500' }}>WABA ID:</span>
          <span style={{ 
            fontFamily: 'monospace',
            color: config.wabaId ? '#16a34a' : '#ef4444'
          }}>
            {config.wabaId || 'No configurado'}
          </span>
        </div>

        {!isValid && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#dc2626',
              marginBottom: '4px'
            }}>
              Problemas de configuración:
            </div>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '16px', 
              fontSize: '12px', 
              color: '#dc2626' 
            }}>
              {issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
            <div style={{ 
              fontSize: '12px', 
              color: '#dc2626',
              marginTop: '8px'
            }}>
              Asegúrate de tener un archivo .env con las variables correctas.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigCheck;
