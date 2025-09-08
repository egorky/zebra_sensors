import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { read, utils } from 'xlsx';
import useAppStore from '../../stores/useAppStore';

const ExcelUpload = () => {
  const navigate = useNavigate();
  const { 
    excelData, 
    selectedTemplate,
    setExcelData 
  } = useAppStore();
  
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validar tipo de archivo
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten archivos .xlsx, .xls o .csv');
      }

      // Validar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. Máximo 10MB permitido.');
      }

      // Leer archivo
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer);
      
      // Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('El archivo está vacío.');
      }

      // Separar headers y datos
      const headers = jsonData[0] || [];
      const data = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
      
      if (headers.length === 0) {
        throw new Error('No se encontraron encabezados en el archivo.');
      }
      
      if (data.length === 0) {
        throw new Error('No se encontraron datos en el archivo.');
      }

      // Crear objeto de datos de Excel
      const excelDataObj = {
        fileName: file.name,
        headers: headers.map(h => String(h || '')),
        data: data.map(row => 
          headers.map((_, index) => 
            row[index] !== undefined ? String(row[index]) : ''
          )
        ),
        totalRows: data.length,
        uploadedAt: new Date().toISOString()
      };

      setExcelData(excelDataObj);
      
      // Avanzar al siguiente paso si hay una plantilla seleccionada
      if (selectedTemplate) {
        navigate('/mapping');
      }
      
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err.message || 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearFile = () => {
    setExcelData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

const downloadTemplate = () => {
    try {
      // Crear datos de ejemplo basados en la plantilla seleccionada si existe
      const headers = selectedTemplate
        ? ['telefono', ...selectedTemplate.components
            .find(c => c.type === 'BODY')?.parameters
            .map(p => `parametro_${p.index}`)
          ]
        : ['telefono', 'nombre', 'apellido', 'empresa', 'codigo', 'fecha'];

      const exampleRows = [
        // Fila 1
        ['+1234567890', 'Juan', 'Pérez', 'Acme Corp', 'DESC123', '2024-12-31'],
        // Fila 2
        ['+0987654321', 'María', 'García', 'Tech Solutions', 'SAVE456', '2024-12-25'],
        // Fila 3
        ['+5555555555', 'Carlos', 'López', 'Digital Agency', 'PROMO789', '2024-12-20']
      ];

      // Asegurar que las filas tengan la misma longitud que los headers
      const normalizedRows = exampleRows.map(row => {
        const newRow = [...row];
        while (newRow.length < headers.length) {
          newRow.push(`Valor ${newRow.length + 1}`);
        }
        return newRow.slice(0, headers.length);
      });

      // Crear el archivo Excel
      const templateData = [headers, ...normalizedRows];
      const ws = utils.aoa_to_sheet(templateData);

      // Ajustar el ancho de las columnas
      const colWidths = headers.map(header => ({ wch: Math.max(header.length * 1.5, 12) }));
      ws['!cols'] = colWidths;

      // Dar formato a la primera fila (headers)
      const headerStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E5E7EB' } },
        alignment: { horizontal: 'center' }
      };

      const range = utils.decode_range(ws['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = utils.encode_cell({ r: 0, c: col });
        ws[cellRef].s = headerStyle;
      }

      // Crear el libro y agregar la hoja
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Plantilla');

      // Generar y descargar
      const wbout = utils.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false,
        compression: true
      });

      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Crear nombre de archivo basado en la plantilla
      const fileName = selectedTemplate
        ? `plantilla_${selectedTemplate.name.toLowerCase()}.xlsx`
        : 'plantilla_datos.xlsx';

      // Descargar
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generando plantilla:', error);
      alert('Error al generar el archivo de plantilla. Por favor, intente nuevamente.');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          Cargar Archivo Excel
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: 0
        }}>
          Sube tu archivo Excel con los datos de los destinatarios para personalizar los mensajes
        </p>
      </div>

      {/* Advertencia si no hay plantilla seleccionada */}
      {!selectedTemplate && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={16} style={{ color: '#f59e0b' }} />
          <span style={{ color: '#92400e', fontSize: '14px' }}>
            Recomendamos seleccionar una plantilla primero para ver qué campos necesitas en tu Excel.
          </span>
        </div>
      )}

      {/* Botón de descarga de plantilla */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={downloadTemplate}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Download size={16} />
          Descargar Plantilla de Ejemplo
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={16} style={{ color: '#dc2626' }} />
          <span style={{ color: '#dc2626', fontSize: '14px' }}>
            {error}
          </span>
        </div>
      )}

      {/* Zona de carga */}
      {!excelData ? (
        <div className="card">
          <div
            style={{
              border: `2px dashed ${dragActive ? '#25d366' : '#d1d5db'}`,
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: dragActive ? '#f0fdf4' : '#fafafa',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload 
              size={48} 
              style={{ 
                color: dragActive ? '#25d366' : '#6b7280', 
                marginBottom: '16px' 
              }} 
            />
            
            <h3 style={{
              color: dragActive ? '#166534' : '#374151',
              margin: '0 0 8px 0',
              fontSize: '18px'
            }}>
              {isProcessing ? 'Procesando archivo...' : 
               dragActive ? 'Suelta el archivo aquí' : 
               'Arrastra tu archivo Excel aquí'}
            </h3>
            
            <p style={{
              color: '#6b7280',
              margin: '0 0 16px 0',
              fontSize: '14px'
            }}>
              o haz clic para seleccionar un archivo
            </p>
            
            <div style={{
              fontSize: '12px',
              color: '#9ca3af',
              lineHeight: '1.5'
            }}>
              Formatos soportados: .xlsx, .xls, .csv<br />
              Tamaño máximo: 10MB
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      ) : (
        /* Vista previa de datos cargados */
        <div className="card">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={24} style={{ color: '#16a34a' }} />
              <div>
                <h3 style={{ margin: 0, color: '#166534' }}>
                  Archivo cargado: {excelData.fileName}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#166534', fontSize: '14px' }}>
                  {excelData.totalRows} filas • {excelData.headers.length} columnas
                </p>
              </div>
            </div>
            
            <button
              onClick={clearFile}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Vista previa de la tabla */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    {excelData.headers.map((header, index) => (
                      <th key={index} style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.data.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{
                          padding: '12px',
                          borderBottom: '1px solid #f3f4f6',
                          color: '#6b7280'
                        }}>
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {excelData.data.length > 5 && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                textAlign: 'center',
                fontSize: '12px',
                color: '#6b7280',
                borderTop: '1px solid #e5e7eb'
              }}>
                ... y {excelData.data.length - 5} filas más
              </div>
            )}
          </div>

          {/* Acciones */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px'
          }}>
            <button
              onClick={() => navigate('/mapping')}
              className="btn-primary"
              disabled={!selectedTemplate}
              style={{
                opacity: !selectedTemplate ? 0.6 : 1
              }}
            >
              Continuar al Mapeo
            </button>
            
            <button
              onClick={clearFile}
              className="btn-secondary"
            >
              Cargar Otro Archivo
            </button>
          </div>
          
          {!selectedTemplate && (
            <p style={{
              margin: '12px 0 0 0',
              fontSize: '14px',
              color: '#f59e0b'
            }}>
              Selecciona una plantilla primero para continuar al mapeo de campos.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelUpload;
