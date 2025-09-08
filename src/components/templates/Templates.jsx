import React, { useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

const Templates = () => {
  const { 
    templates, 
    selectedTemplate, 
    isLoading,
    error,
    loadTemplatesFromApi,
    refreshTemplates,
    selectTemplate,
    setCurrentStep 
  } = useAppStore();

  useEffect(() => {
    console.log('🔄 Templates useEffect triggered:', { 
      templatesLength: templates.length, 
      isLoading,
      hasLoadFunction: !!loadTemplatesFromApi 
    });
    
    if (templates.length === 0 && !isLoading) {
      console.log('📡 Attempting to load templates from API...');
      loadTemplatesFromApi({ status: 'APPROVED' }).catch(err => {
        console.error('❌ Error loading templates:', err);
      });
    } else {
      console.log('ℹ️ Skipping template load:', {
        reason: templates.length > 0 ? 'Templates already loaded' : 'Currently loading'
      });
    }
  }, [templates.length, isLoading, loadTemplatesFromApi]);

  const handleRefresh = () => {
    refreshTemplates().catch(err => {
      console.error('Error refreshing templates:', err);
    });
  };

  const handleSelectTemplate = (template) => {
    selectTemplate(template);
    setCurrentStep(2); // Avanzar al siguiente paso
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'REJECTED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'MARKETING': return '#8b5cf6';
      case 'TRANSACTIONAL': return '#3b82f6';
      case 'UTILITY': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              Plantillas de WhatsApp
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0
            }}>
              Selecciona una plantilla aprobada para enviar mensajes masivos
            </p>
          </div>
          
          <button
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} style={{ 
              animation: isLoading ? 'spin 1s linear infinite' : 'none'
            }} />
            {isLoading ? 'Cargando...' : 'Refrescar'}
          </button>
        </div>
        
        {/* Error State */}
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
            <AlertTriangle size={16} style={{ color: '#dc2626' }} />
            <span style={{ color: '#dc2626', fontSize: '14px' }}>
              {error}
            </span>
          </div>
        )}
      </div>

      {selectedTemplate && (
        <div className="card" style={{ 
          marginBottom: '24px',
          backgroundColor: '#f0fdf4',
          border: '2px solid #25d366'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={24} style={{ color: '#25d366' }} />
            <div>
              <h3 style={{ margin: 0, color: '#166534' }}>
                Plantilla seleccionada: {selectedTemplate.name}
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#166534', fontSize: '14px' }}>
                Idioma: {selectedTemplate.language} | Categoría: {selectedTemplate.category}
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {templates.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;
          const bodyComponent = template.components.find(c => c.type === 'BODY');
          
          return (
            <div
              key={template.id}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: isSelected ? '2px solid #25d366' : '1px solid #e5e7eb',
                backgroundColor: isSelected ? '#f0fdf4' : 'white'
              }}
              onClick={() => handleSelectTemplate(template)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} style={{ color: '#25d366' }} />
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {template.name}
                  </h3>
                </div>
                
                {isSelected && (
                  <CheckCircle size={20} style={{ color: '#25d366' }} />
                )}
              </div>

              {/* Status and Category */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: getStatusColor(template.status) + '20',
                  color: getStatusColor(template.status),
                  fontWeight: '500'
                }}>
                  {template.status}
                </span>
                
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: getCategoryColor(template.category) + '20',
                  color: getCategoryColor(template.category),
                  fontWeight: '500'
                }}>
                  {template.category}
                </span>
                
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {template.language.toUpperCase()}
                </span>
              </div>

              {/* Content Preview */}
              {bodyComponent && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#374151',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {bodyComponent.text}
                  </p>
                </div>
              )}

              {/* Parameters Count */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                <span>
                  {template.components.reduce((acc, comp) => 
                    acc + (comp.parameters?.length || 0), 0
                  )} parámetros
                </span>
                <span>
                  {new Date(template.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '64px' }}>
          <Clock size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
          <h3 style={{ color: '#6b7280', margin: '0 0 8px 0' }}>
            Cargando plantillas...
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Por favor espera mientras cargamos las plantillas disponibles
          </p>
        </div>
      )}
    </div>
  );
};

export default Templates;
