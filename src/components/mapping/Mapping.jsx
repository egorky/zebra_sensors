import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitMerge, AlertCircle, CheckCircle, ArrowDown, MessageSquare, Image, Eye, EyeOff, Save } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
const getTemplateParameters = (template) => {
  const parameters = [];
  
  template.components.forEach(component => {
    if (component.parameters && component.parameters.length > 0) {
      component.parameters.forEach(param => {
        if (!parameters.find(p => p.index === param.index)) {
          parameters.push({
            index: param.index,
            type: param.type,
            componentType: component.type
          });
        }
      });
    }
  });
  
  return parameters.sort((a, b) => a.index - b.index);
};

const Mapping = () => {
  const navigate = useNavigate();
  const {
    selectedTemplate,
    excelData,
    fieldMappings,
    addFieldMapping,
    removeFieldMapping
  } = useAppStore();
  
  const [templateParameters, setTemplateParameters] = useState([]);
  const [errors, setErrors] = useState([]);
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [hasHeaderImage, setHasHeaderImage] = useState(false);

  useEffect(() => {
    if (selectedTemplate) {
      const params = getTemplateParameters(selectedTemplate);
      setTemplateParameters(params);
      
      // Detectar si la plantilla tiene un header de imagen
      const headerComponent = selectedTemplate.components.find(c => c.type === 'HEADER');
      const hasImage = headerComponent && headerComponent.format === 'IMAGE';
      setHasHeaderImage(hasImage);
      
      if (hasImage) {
        // Cargar URL desde localStorage o usar la por defecto
        const savedUrl = localStorage.getItem('whatsapp-header-image-url') || 
                         import.meta.env.VITE_DEFAULT_HEADER_IMAGE_URL;
        setHeaderImageUrl(savedUrl);
        console.log('📸 Template has image header, loaded URL:', savedUrl);
      }
    }
  }, [selectedTemplate]);

  const handleMapping = (parameterIndex, columnIndex, columnName) => {
    // Si se selecciona 'Seleccionar parámetro...' (-1), eliminar el mapeo
    if (parameterIndex === -1) {
      // Buscar y eliminar cualquier mapeo existente para esta columna
      const existingMapping = fieldMappings.find(m => m.columnIndex === columnIndex);
      if (existingMapping) {
        removeFieldMapping(existingMapping.parameterIndex);
      }
      return;
    }

    // Si la columna ya estaba mapeada a otro parámetro, eliminar ese mapeo primero
    const existingColumnMapping = fieldMappings.find(m => m.columnIndex === columnIndex);
    if (existingColumnMapping) {
      removeFieldMapping(existingColumnMapping.parameterIndex);
    }

    // Si el parámetro ya estaba mapeado a otra columna, eliminar ese mapeo
    const existingParamMapping = fieldMappings.find(m => m.parameterIndex === parameterIndex);
    if (existingParamMapping) {
      removeFieldMapping(parameterIndex);
    }

    // Agregar el nuevo mapeo
    addFieldMapping({
      parameterIndex,
      columnIndex,
      columnName,
      parameterType: templateParameters.find(p => p.index === parameterIndex)?.type || 'TEXT'
    });
  };

  const resetAllMappings = () => {
    fieldMappings.forEach(mapping => {
      removeFieldMapping(mapping.parameterIndex);
    });
  };

  const validateMappings = () => {
    const newErrors = [];
    
    // Verificar que todos los parámetros estén mapeados
    templateParameters.forEach(param => {
      const mapping = fieldMappings.find(m => m.parameterIndex === param.index);
      if (!mapping) {
        newErrors.push(`El parámetro {{${param.index}}} no está mapeado`);
      }
    });
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleContinue = () => {
    if (validateMappings()) {
      navigate('/preview');
    }
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
            Mapear Campos
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Asigna las columnas del Excel a los campos de la plantilla
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '64px' }}>
          <AlertCircle size={64} style={{ color: '#f59e0b', marginBottom: '24px' }} />
          <h3 style={{ color: '#f59e0b', margin: '0 0 16px 0', fontSize: '24px' }}>
            Selecciona una plantilla primero
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
            Necesitas seleccionar una plantilla de WhatsApp antes de poder mapear los campos.
          </p>
        </div>
      </div>
    );
  }

  if (!excelData) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            Mapear Campos
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Asigna las columnas del Excel a los campos de la plantilla
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '64px' }}>
          <AlertCircle size={64} style={{ color: '#f59e0b', marginBottom: '24px' }} />
          <h3 style={{ color: '#f59e0b', margin: '0 0 16px 0', fontSize: '24px' }}>
            Carga un archivo Excel primero
          </h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
            Necesitas cargar un archivo Excel con los datos antes de poder mapear los campos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Mapear Campos
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: 0
        }}>
          Asigna las columnas de tu Excel a los parámetros de la plantilla seleccionada
        </p>
      </div>

      {/* Información de plantilla seleccionada */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <MessageSquare size={24} style={{ color: '#25d366' }} />
          <div>
            <h3 style={{ margin: 0, color: '#111827' }}>
              Plantilla: {selectedTemplate.name}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              {selectedTemplate.language} • {selectedTemplate.category}
            </p>
          </div>
        </div>
        
        {/* Vista previa del mensaje */}
        {selectedTemplate.components.find(c => c.type === 'BODY') && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Contenido del mensaje:
            </h4>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              {selectedTemplate.components.find(c => c.type === 'BODY').text}
            </p>
          </div>
        )}
      </div>

      {/* Configuración de imagen de header (solo si la plantilla tiene header de imagen) */}
      {hasHeaderImage && (
        <div className="card" style={{ marginBottom: '24px', border: '2px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Image size={24} style={{ color: '#8b5cf6' }} />
            <div>
              <h3 style={{ margin: 0, color: '#7c3aed', fontSize: '18px' }}>
                Configuración de Imagen de Header
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                Esta plantilla requiere una imagen en el header. Configura la URL de la imagen.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '8px',
                color: '#374151'
              }}>
                URL de la Imagen:
              </label>
              <input
                type="url"
                value={headerImageUrl}
                onChange={(e) => setHeaderImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  try {
                    new URL(headerImageUrl);
                    localStorage.setItem('whatsapp-header-image-url', headerImageUrl);
                    console.log('✅ URL de imagen guardada:', headerImageUrl);
                    alert('URL de imagen guardada correctamente');
                  } catch (error) {
                    alert('Por favor ingresa una URL válida');
                  }
                }}
                className="btn-secondary"
                disabled={!headerImageUrl}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: !headerImageUrl ? 0.6 : 1,
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  borderColor: '#8b5cf6'
                }}
              >
                <Save size={16} />
                Guardar URL
              </button>
              
              <button
                onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isPreviewVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                {isPreviewVisible ? 'Ocultar' : 'Vista Previa'}
              </button>
              
              <button
                onClick={() => {
                  const defaultUrl = import.meta.env.VITE_DEFAULT_HEADER_IMAGE_URL;
                  setHeaderImageUrl(defaultUrl);
                  localStorage.setItem('whatsapp-header-image-url', defaultUrl);
                }}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Image size={16} />
                URL por Defecto
              </button>
            </div>
            
            {isPreviewVisible && headerImageUrl && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Vista Previa:
                </label>
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: '#f9fafb'
                }}>
                  <img
                    src={headerImageUrl}
                    alt="Vista previa de imagen de header"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '150px',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                    onLoad={() => console.log('✅ Imagen cargada correctamente')}
                    onError={() => console.error('❌ Error cargando imagen')}
                  />
                </div>
              </div>
            )}
            
            <div style={{
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#4b5563'
            }}>
              <strong>📋 Recomendaciones:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Usa imágenes con ratio 1.91:1 (recomendado para WhatsApp)</li>
                <li>Tamaño máximo: 5MB</li>
                <li>Formatos soportados: JPEG, PNG</li>
                <li>Asegúrate de que la URL sea accesible públicamente</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Errores de validación */}
      {errors.length > 0 && (
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
              Faltan campos por mapear:
            </h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#dc2626', fontSize: '14px' }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mapeo de campos */}
      <div className="card">
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 24px 0'
        }}>
          Mapeo de Campos
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Parámetros de la plantilla */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 16px 0'
            }}>
              Parámetros de la Plantilla
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {templateParameters.map(param => {
                const mapping = fieldMappings.find(m => m.parameterIndex === param.index);
                
                return (
                  <div
                    key={param.index}
                    style={{
                      padding: '16px',
                      border: `2px solid ${mapping ? '#25d366' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      backgroundColor: mapping ? '#f0fdf4' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: mapping ? '#25d366' : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: mapping ? 'white' : '#6b7280'
                      }}>
                        {param.index}
                      </div>
                      <span style={{
                        fontWeight: '600',
                        color: mapping ? '#166534' : '#374151'
                      }}>
                        {`{{${param.index}}}`}
                      </span>
                      {mapping && (
                        <CheckCircle size={16} style={{ color: '#25d366' }} />
                      )}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Tipo: {param.type} • Componente: {param.componentType}
                    </div>
                    
                    {mapping && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#166534',
                        fontWeight: '500'
                      }}>
                        → Mapeado a: {mapping.columnName}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flecha indicadora */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '200px'
          }}>
            <ArrowDown 
              size={32} 
              style={{ 
                color: '#6b7280',
                transform: 'rotate(-90deg)'
              }} 
            />
          </div>

          {/* Columnas del Excel */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 16px 0'
            }}>
              Columnas del Excel
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              {excelData.headers.map((header, index) => {
                const mappedTo = fieldMappings.find(m => m.columnIndex === index);
                
                return (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      border: `2px solid ${mappedTo ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      backgroundColor: mappedTo ? '#eff6ff' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        fontWeight: '600',
                        color: mappedTo ? '#1e40af' : '#374151'
                      }}>
                        {header}
                      </span>
                      {mappedTo && (
                        <CheckCircle size={16} style={{ color: '#3b82f6' }} />
                      )}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                      Columna {index + 1} • Ejemplo: {excelData.data[0]?.[index] || 'N/A'}
                    </div>
                    
                    {/* Selector de mapeo */}
                    <select
                      value={mappedTo ? mappedTo.parameterIndex : -1}
                      onChange={(e) => {
                        const paramIndex = parseInt(e.target.value);
                        handleMapping(paramIndex, index, header);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value={-1}>Seleccionar parámetro...</option>
                      {templateParameters.map(param => (
                        <option 
                          key={param.index} 
                          value={param.index}
                          disabled={fieldMappings.some(m => m.parameterIndex === param.index && m.columnIndex !== index)}
                        >
                          {`{{${param.index}}} (${param.type})`}
                        </option>
                      ))}
                    </select>
                    
                    {mappedTo && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: '#1e40af',
                        fontWeight: '500'
                      }}>
                        → Mapeado a: {`{{${mappedTo.parameterIndex}}}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* Acciones */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleContinue}
              className="btn-primary"
              disabled={templateParameters.length !== fieldMappings.length}
              style={{
                opacity: templateParameters.length !== fieldMappings.length ? 0.6 : 1
              }}
            >
              Continuar a Vista Previa
            </button>
            
            <button
              onClick={() => navigate('/upload')}
              className="btn-secondary"
            >
              Volver al Excel
            </button>
          </div>

          {/* Botón de Reset */}
          {fieldMappings.length > 0 && (
            <button
              onClick={resetAllMappings}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#dc2626',
                borderColor: '#dc2626',
                backgroundColor: '#fef2f2'
              }}
            >
              <AlertCircle size={16} />
              Reiniciar Mapeo
            </button>
          )}
        </div>
        
        {/* Estado del mapeo */}
        <div style={{
          marginTop: '16px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {fieldMappings.length} de {templateParameters.length} parámetros mapeados
          {templateParameters.length === fieldMappings.length && (
            <span style={{ color: '#16a34a', marginLeft: '8px' }}>
              ✓ Mapeo completo
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mapping;
