import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Upload, 
  GitMerge, 
  Eye, 
  ArrowRight,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import { getApiConfig } from '../../services/whatsappApi';
import ApiDiagnostic from './ApiDiagnostic';
import ConfigCheck from './ConfigCheck';

const Home = () => {
  const { 
    templates, 
    selectedTemplate, 
    excelData, 
    fieldMappings, 
    currentStep,
    isLoading,
    error,
    apiConfigValid,
    loadTemplatesFromApi,
    setCurrentStep 
  } = useAppStore();

  useEffect(() => {
    // Cargar plantillas desde la API si no están cargadas
    if (templates.length === 0 && !isLoading) {
      loadTemplatesFromApi({ status: 'APPROVED' }).catch(err => {
        console.error('Error loading templates on Home:', err);
      });
    }
  }, [templates.length, isLoading, loadTemplatesFromApi]);

  const steps = [
    {
      id: 1,
      title: 'Seleccionar Plantilla',
      description: 'Elige una plantilla de WhatsApp Business',
      icon: MessageSquare,
      path: '/templates',
      completed: !!selectedTemplate,
      current: currentStep === 1
    },
    {
      id: 2,
      title: 'Cargar Datos Excel',
      description: 'Sube tu archivo con los datos de destinatarios',
      icon: Upload,
      path: '/upload',
      completed: !!excelData,
      current: currentStep === 2
    },
    {
      id: 3,
      title: 'Mapear Campos',
      description: 'Asigna las columnas del Excel a los campos de la plantilla',
      icon: GitMerge,
      path: '/mapping',
      completed: fieldMappings.length > 0,
      current: currentStep === 3
    },
    {
      id: 4,
      title: 'Vista Previa',
      description: 'Revisa los mensajes antes del envío masivo',
      icon: Eye,
      path: '/preview',
      completed: false,
      current: currentStep === 4
    }
  ];

  const handleStepClick = (step) => {
    setCurrentStep(step.id);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: '800',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          WhatsApp Templates Manager
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          margin: '0 0 16px 0'
        }}>
          Administra y envía mensajes masivos personalizados a través de plantillas de WhatsApp Business
        </p>
        
        {/* API Status */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <Clock size={16} style={{ color: '#f59e0b' }} />
            <span style={{ color: '#92400e', fontSize: '14px' }}>
              Cargando plantillas desde WhatsApp Cloud API...
            </span>
          </div>
        )}
        
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <span style={{ color: '#dc2626', fontSize: '14px' }}>
              ❌ Error: {error}
            </span>
          </div>
        )}
        
        {apiConfigValid && templates.length > 0 && !isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <CheckCircle size={16} style={{ color: '#16a34a' }} />
            <span style={{ color: '#166534', fontSize: '14px' }}>
              ✅ Conectado a WhatsApp Cloud API - {templates.length} plantillas cargadas
            </span>
          </div>
        )}
      </div>

      {/* Configuration Check */}
      <ConfigCheck />
      
      {/* API Diagnostic - show if there are errors or during initial load */}
      {(error || (!apiConfigValid && !isLoading) || (isLoading && templates.length === 0)) && (
        <ApiDiagnostic />
      )}

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <MessageSquare size={32} style={{ color: '#25d366', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 4px 0' }}>
            {templates.length}
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Plantillas Disponibles</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <FileText size={32} style={{ color: '#3b82f6', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 4px 0' }}>
            {excelData ? excelData.totalRows.toLocaleString() : 0}
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Registros Cargados</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <GitMerge size={32} style={{ color: '#8b5cf6', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 4px 0' }}>
            {fieldMappings.length}
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Campos Mapeados</p>
        </div>
      </div>

      {/* Process Steps */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 24px 0'
        }}>
          Proceso de Envío Masivo
        </h2>

        <div style={{ 
          display: 'grid', 
          gap: '16px'
        }}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            
            return (
              <Link
                key={step.id}
                to={step.path}
                onClick={() => handleStepClick(step)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  backgroundColor: step.current ? '#f0fdf4' : (step.completed ? '#f8fafc' : 'white'),
                  border: `2px solid ${step.current ? '#25d366' : (step.completed ? '#10b981' : '#e5e7eb')}`,
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Step Number */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: step.completed ? '#10b981' : (step.current ? '#25d366' : '#e5e7eb'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  color: step.completed || step.current ? 'white' : '#6b7280',
                  fontWeight: '600'
                }}>
                  {step.completed ? <CheckCircle size={20} /> : step.id}
                </div>

                {/* Icon */}
                <div style={{
                  marginRight: '16px',
                  color: step.completed ? '#10b981' : (step.current ? '#25d366' : '#6b7280')
                }}>
                  <Icon size={24} />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    color: step.completed ? '#065f46' : (step.current ? '#166534' : '#374151')
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {step.description}
                  </p>
                </div>

                {/* Status */}
                <div style={{ marginLeft: '16px' }}>
                  {step.completed ? (
                    <CheckCircle size={20} style={{ color: '#10b981' }} />
                  ) : step.current ? (
                    <Clock size={20} style={{ color: '#25d366' }} />
                  ) : (
                    <ArrowRight size={20} style={{ color: '#6b7280' }} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 24px 0'
        }}>
          Acciones Rápidas
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <Link to="/templates" className="btn-primary" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textDecoration: 'none',
            padding: '16px'
          }}>
            <MessageSquare size={20} />
            Ver Plantillas
          </Link>

          <Link to="/upload" className="btn-secondary" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textDecoration: 'none',
            padding: '16px'
          }}>
            <Upload size={20} />
            Cargar Excel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
