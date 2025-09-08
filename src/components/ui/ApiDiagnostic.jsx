import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  RefreshCw,
  Settings
} from 'lucide-react';
import { getApiConfig, validateApiConfig, getWABAInfo, testConnection, testTemplatesAccess } from '../../services/whatsappApi';

const ApiDiagnostic = () => {
  const [diagnosticResults, setDiagnosticResults] = useState({
    configLoaded: false,
    hasToken: false,
    hasWabaId: false,
    hasPhoneId: false,
    basicConnection: null,
    apiConnection: null,
    templatesAccess: null,
    templatesCount: 0,
    wabaInfo: null,
    error: null
  });
  
  const [showToken, setShowToken] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const results = {
      configLoaded: false,
      hasToken: false,
      hasWabaId: false,
      hasPhoneId: false,
      basicConnection: null,
      apiConnection: null,
      templatesAccess: null,
      templatesCount: 0,
      wabaInfo: null,
      error: null
    };

    try {
      // 1. Verificar configuración básica
      console.log('🔍 Checking API configuration...');
      const config = getApiConfig();
      
      results.configLoaded = true;
      results.hasToken = config.accessToken !== 'Not set';
      results.hasWabaId = !!config.wabaId;
      results.hasPhoneId = !!config.phoneNumberId;

      console.log('📋 Config loaded:', config);

      // 2. Probar conexión básica primero
      if (results.hasToken) {
        try {
          console.log('🧪 Testing basic connection...');
          const basicTest = await testConnection();
          results.basicConnection = basicTest.success;
          
          if (!basicTest.success) {
            results.error = basicTest.error;
          }
        } catch (basicError) {
          console.error('❌ Basic connection error:', basicError);
          results.basicConnection = false;
          results.error = basicError.message;
        }
      }
      
      // 3. Probar conexión completa con WABA
      if (results.hasToken && results.hasWabaId && results.basicConnection) {
        try {
          console.log('🌐 Testing WABA connection...');
          const wabaInfo = await getWABAInfo();
          results.apiConnection = true;
          results.wabaInfo = wabaInfo;
          console.log('✅ WABA Info:', wabaInfo);
        } catch (apiError) {
          console.error('❌ WABA API Error:', apiError);
          results.apiConnection = false;
          if (!results.error) {
            results.error = apiError.message;
          }
        }
      }
      
      // 4. Probar acceso a plantillas
      if (results.hasToken && results.hasWabaId && results.basicConnection && results.apiConnection) {
        try {
          console.log('🗺 Testing templates access...');
          const templatesTest = await testTemplatesAccess();
          results.templatesAccess = templatesTest.success;
          results.templatesCount = templatesTest.templatesCount;
          
          if (!templatesTest.success) {
            console.error('❌ Templates access failed:', templatesTest.error);
          } else {
            console.log(`✅ Templates access successful: ${templatesTest.templatesCount} templates found`);
          }
        } catch (templatesError) {
          console.error('❌ Templates test error:', templatesError);
          results.templatesAccess = false;
          results.templatesCount = 0;
        }
      }

    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      results.error = error.message;
    }

    setDiagnosticResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const config = getApiConfig();

  const DiagnosticItem = ({ label, status, details, icon: Icon }) => {
    let statusColor, statusIcon, bgColor;
    
    switch (status) {
      case 'success':
        statusColor = '#16a34a';
        statusIcon = CheckCircle;
        bgColor = '#f0fdf4';
        break;
      case 'error':
        statusColor = '#dc2626';
        statusIcon = XCircle;
        bgColor = '#fef2f2';
        break;
      case 'warning':
        statusColor = '#f59e0b';
        statusIcon = AlertTriangle;
        bgColor = '#fef3c7';
        break;
      default:
        statusColor = '#6b7280';
        statusIcon = AlertTriangle;
        bgColor = '#f9fafb';
    }

    const StatusIcon = statusIcon;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: bgColor,
        border: `1px solid ${statusColor}40`,
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ marginRight: '12px' }}>
          {Icon && <Icon size={20} style={{ color: statusColor }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ margin: 0, color: '#111827' }}>{label}</h4>
            <StatusIcon size={16} style={{ color: statusColor }} />
          </div>
          {details && (
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              {details}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            Diagnóstico de API WhatsApp
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Verificación del estado de configuración y conexión
          </p>
        </div>
        
        <button
          className="btn-secondary"
          onClick={runDiagnostic}
          disabled={isRunning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          <RefreshCw size={16} style={{ 
            animation: isRunning ? 'spin 1s linear infinite' : 'none'
          }} />
          {isRunning ? 'Verificando...' : 'Verificar'}
        </button>
      </div>

      {/* Configuración */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Configuración
        </h3>
        
        <DiagnosticItem
          label="Variables de entorno cargadas"
          status={diagnosticResults.configLoaded ? 'success' : 'error'}
          details={diagnosticResults.configLoaded ? 'Configuración detectada' : 'No se pudo cargar la configuración'}
          icon={Settings}
        />

        <DiagnosticItem
          label="Access Token"
          status={diagnosticResults.hasToken ? 'success' : 'error'}
          details={diagnosticResults.hasToken ? 
            `${config.accessToken.substring(0, 20)}...` : 
            'VITE_WHATSAPP_ACCESS_TOKEN no configurado'}
          icon={showToken ? EyeOff : Eye}
        />

        <DiagnosticItem
          label="WABA ID"
          status={diagnosticResults.hasWabaId ? 'success' : 'error'}
          details={diagnosticResults.hasWabaId ? 
            config.wabaId : 
            'VITE_META_WABA_ID no configurado'}
        />

        <DiagnosticItem
          label="Phone Number ID"
          status={diagnosticResults.hasPhoneId ? 'success' : 'error'}
          details={diagnosticResults.hasPhoneId ? 
            config.phoneNumberId : 
            'VITE_WHATSAPP_PHONE_NUMBER_ID no configurado'}
        />
      </div>

      {/* Conexión API */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Conexión API
        </h3>
        
        {diagnosticResults.basicConnection !== null && (
          <DiagnosticItem
            label="Conexión básica con Meta Graph API"
            status={diagnosticResults.basicConnection ? 'success' : 'error'}
            details={diagnosticResults.basicConnection ? 
              'Token válido - conexión básica exitosa' : 
              `Error de token: ${diagnosticResults.error}`}
          />
        )}
        
        {diagnosticResults.apiConnection !== null && (
          <DiagnosticItem
            label="Conexión completa con WABA"
            status={diagnosticResults.apiConnection ? 'success' : 'error'}
            details={diagnosticResults.apiConnection ? 
              'Acceso completo a la cuenta WABA' : 
              `Error de WABA: ${diagnosticResults.error}`}
          />
        )}

        {diagnosticResults.wabaInfo && (
          <DiagnosticItem
            label="Información de cuenta WABA"
            status="success"
            details={`${diagnosticResults.wabaInfo.name} - ${diagnosticResults.wabaInfo.account_review_status}`}
          />
        )}
        
        {diagnosticResults.templatesAccess !== null && (
          <DiagnosticItem
            label="Acceso a plantillas de mensajes"
            status={diagnosticResults.templatesAccess ? 'success' : 'error'}
            details={diagnosticResults.templatesAccess ? 
              `${diagnosticResults.templatesCount} plantillas encontradas` : 
              'No se pudieron cargar las plantillas'}
          />
        )}
      </div>

      {/* Información de debug */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
          Información de Debug
        </h4>
        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>
          <div>API Version: {config.apiVersion}</div>
          <div>Base URL: {config.baseUrl}</div>
          <div>Timestamp: {new Date().toISOString()}</div>
        </div>
      </div>

      {/* Instrucciones */}
      {(!diagnosticResults.hasToken || !diagnosticResults.hasWabaId || !diagnosticResults.apiConnection) && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#92400e' }}>
            Pasos para configurar la API:
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
            <li>Verifica que el archivo .env contenga todas las variables</li>
            <li>Asegúrate de que las variables empiecen con VITE_</li>
            <li>Verifica que el token de acceso sea válido</li>
            <li>Confirma que el WABA ID sea correcto</li>
            <li>Reinicia el servidor de desarrollo después de cambios</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostic;
