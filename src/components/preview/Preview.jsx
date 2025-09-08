import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, AlertCircle, CheckCircle, Send, Download, MessageSquare, Phone, XCircle, Loader } from 'lucide-react';
import { sendBatchTemplateMessages, formatTemplateComponents } from '../../services/whatsappMessaging';
import useAppStore from '../../stores/useAppStore';

const Preview = () => {
  const navigate = useNavigate();
  const {
    selectedTemplate,
    excelData,
    fieldMappings,
    previewMessages,
    generatePreviewMessages
  } = useAppStore();
  
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [showAll, setShowAll] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(null);
  const [sendResults, setSendResults] = useState(null);

  useEffect(() => {
    if (selectedTemplate && excelData && fieldMappings.length > 0) {
      generatePreviewMessages();
    }
  }, [selectedTemplate, excelData, fieldMappings, generatePreviewMessages]);

  const toggleMessageSelection = (index) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMessages(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedMessages.size === previewMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(previewMessages.map((_, index) => index)));
    }
  };

  const exportPreview = () => {
    const csvContent = [
      ['Telefono', 'Mensaje', 'Valido', 'Errores'],
      ...previewMessages.map(msg => [
        msg.phoneNumber,
        msg.message.replace(/,/g, ';'),
        msg.isValid ? 'SI' : 'NO',
        msg.errors.join('; ')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vista_previa_mensajes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedTemplate) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            Vista Previa
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Revisa los mensajes antes del envío masivo
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '64px' }}>
          <AlertCircle size={64} style={{ color: '#f59e0b', marginBottom: '24px' }} />
          <h3 style={{ color: '#f59e0b', margin: '0 0 16px 0', fontSize: '24px' }}>
            Falta información
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
            Necesitas completar todos los pasos anteriores antes de ver la vista previa.
          </p>
        </div>
      </div>
    );
  }

  if (!excelData || fieldMappings.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            Vista Previa
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Revisa los mensajes antes del envío masivo
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '64px' }}>
          <AlertCircle size={64} style={{ color: '#f59e0b', marginBottom: '24px' }} />
          <h3 style={{ color: '#f59e0b', margin: '0 0 16px 0', fontSize: '24px' }}>
            Completa los pasos anteriores
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
            Necesitas cargar un Excel y mapear los campos antes de generar la vista previa.
          </p>
        </div>
      </div>
    );
  }

  const validMessages = previewMessages.filter(msg => msg.isValid);
  const invalidMessages = previewMessages.filter(msg => !msg.isValid);
  const displayMessages = showAll ? previewMessages : previewMessages.slice(0, 10);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Vista Previa de Mensajes
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: 0
        }}>
          Revisa los mensajes personalizados antes del envío masivo
        </p>
      </div>

      {/* Resumen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <MessageSquare size={24} style={{ color: '#3b82f6', marginBottom: '8px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
            {previewMessages.length}
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Total de Mensajes</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <CheckCircle size={24} style={{ color: '#16a34a', marginBottom: '8px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
            {validMessages.length}
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Mensajes Válidos</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <AlertCircle size={24} style={{ color: '#ef4444', marginBottom: '8px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
            {invalidMessages.length}
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Con Errores</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <Phone size={24} style={{ color: '#8b5cf6', marginBottom: '8px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0' }}>
            {selectedMessages.size}
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>Seleccionados</p>
        </div>
      </div>

      {/* Información de la plantilla */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#111827' }}>
              Plantilla: {selectedTemplate.name}
            </h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              {selectedTemplate.language} • {selectedTemplate.category} • {fieldMappings.length} campos mapeados
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={exportPreview}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Errores globales */}
      {invalidMessages.length > 0 && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertCircle size={16} style={{ color: '#dc2626' }} />
            <h4 style={{ margin: 0, color: '#dc2626', fontSize: '14px', fontWeight: '600' }}>
              {invalidMessages.length} mensajes con errores encontrados
            </h4>
          </div>
          <p style={{ margin: 0, color: '#dc2626', fontSize: '14px' }}>
            Revisa los mensajes marcados en rojo. Los mensajes con errores no serán enviados.
          </p>
        </div>
      )}

      {/* Lista de mensajes */}
      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Vista Previa de Mensajes
          </h2>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#6b7280',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={selectedMessages.size === previewMessages.length}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
              Seleccionar todos
            </label>
            
            {previewMessages.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="btn-secondary"
                style={{ fontSize: '14px', padding: '6px 12px' }}
              >
                {showAll ? 'Mostrar menos' : `Ver todos (${previewMessages.length})`}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {displayMessages.map((message, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                border: `2px solid ${message.isValid ? '#16a34a' : '#ef4444'}`,
                borderRadius: '8px',
                backgroundColor: message.isValid ? '#f0fdf4' : '#fef2f2'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={selectedMessages.has(index)}
                    onChange={() => toggleMessageSelection(index)}
                    disabled={!message.isValid}
                    style={{ cursor: message.isValid ? 'pointer' : 'not-allowed' }}
                  />
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Phone size={16} style={{ color: '#6b7280' }} />
                    <span style={{
                      fontWeight: '600',
                      color: message.isValid ? '#166534' : '#dc2626'
                    }}>
                      {message.phoneNumber}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {message.isValid ? (
                    <CheckCircle size={16} style={{ color: '#16a34a' }} />
                  ) : (
                    <AlertCircle size={16} style={{ color: '#ef4444' }} />
                  )}
                  
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: message.isValid ? '#166534' : '#dc2626'
                  }}>
                    {message.isValid ? 'VÁLIDO' : 'ERROR'}
                  </span>
                </div>
              </div>

              {/* Mensaje */}
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginBottom: message.errors.length > 0 ? '12px' : 0
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {message.message}
                </div>
              </div>

              {/* Errores */}
              {message.errors.length > 0 && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '6px',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626', marginBottom: '4px' }}>
                    Errores encontrados:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#dc2626' }}>
                    {message.errors.map((error, errorIndex) => (
                      <li key={errorIndex}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Datos de la fila */}
              <details style={{ marginTop: '8px' }}>
                <summary style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  Ver datos de origen
                </summary>
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>
                  {Object.entries(message.rowData).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {value || 'N/A'}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>

        {!showAll && previewMessages.length > 10 && (
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Mostrando 10 de {previewMessages.length} mensajes
          </div>
        )}
      </div>

      {/* Acciones finales */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button
          className="btn-primary"
          disabled={selectedMessages.size === 0 || validMessages.length === 0 || isSending}
          style={{
            opacity: selectedMessages.size === 0 || validMessages.length === 0 || isSending ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={async () => {
            try {
              setIsSending(true);
              setSendResults(null);
              
              // Preparar mensajes seleccionados para nueva API
              const messagesToSend = Array.from(selectedMessages)
                .map(index => previewMessages[index])
                .filter(msg => msg.isValid);
              
              console.log('📦 Preparando mensajes para envío:', messagesToSend.length);
              
              // Enviar mensajes en lote con nueva API
              const results = await sendBatchTemplateMessages({
                messages: messagesToSend,
                template: selectedTemplate,
                fieldMappings: fieldMappings,
                onProgress: (progress) => {
                  setSendProgress(progress);
                }
              });
              
              setSendResults(results);
              
              // Mostrar resultados detallados
              let alertMessage = '';
              
              if (results.sent > 0) {
                alertMessage += `✅ ${results.sent} mensajes enviados exitosamente\n`;
              }
              
              if (results.failed > 0) {
                console.error('Errores en el envío:', results.errors);
                alertMessage += `❌ ${results.failed} mensajes fallaron:\n`;
                
                // Mostrar los primeros 3 errores como ejemplo
                const firstErrors = results.errors.slice(0, 3);
                firstErrors.forEach(error => {
                  alertMessage += `- ${error.phoneNumber}: ${error.error}\n`;
                });
                
                if (results.errors.length > 3) {
                  alertMessage += `... y ${results.errors.length - 3} errores más (ver consola para detalles completos)`;
                }
              }
              
              if (alertMessage) {
                alert(alertMessage);
              }
              
            } catch (error) {
              console.error('Error sending messages:', error);
              alert(`Error al enviar mensajes: ${error.message}`);
            } finally {
              setIsSending(false);
              setSendProgress(null);
            }
          }}
        >
          {isSending ? (
            <>
              <Loader size={16} className="animate-spin" />
              Enviando... ({sendProgress ? `${sendProgress.processed}/${sendProgress.total}` : '0'})
            </>
          ) : (
            <>
              <Send size={16} />
              Enviar Mensajes Seleccionados ({selectedMessages.size})
            </>
          )}
        </button>
        
        <button
          onClick={() => navigate('/mapping')}
          className="btn-secondary"
        >
          Volver al Mapeo
        </button>
      </div>
      
      {validMessages.length === 0 && (
        <div style={{
          marginTop: '16px',
          fontSize: '14px',
          color: '#ef4444'
        }}>
          ⚠️ No hay mensajes válidos para enviar. Revisa el mapeo de campos.
        </div>
      )}
    </div>
  );
};

export default Preview;
