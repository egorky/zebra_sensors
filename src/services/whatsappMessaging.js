// Servicio para envío de mensajes de WhatsApp
import { sendTemplateMessage as apiSendTemplateMessage } from './whatsappApi.js';

/**
 * Envía un mensaje usando una plantilla
 * @param {Object} params - Parámetros del mensaje
 * @param {string} params.to - Número de teléfono del destinatario
 * @param {Object} params.template - Objeto de plantilla completo
 * @param {Array} params.parameters - Parámetros para la plantilla
 * @returns {Promise<Object>}
 */
export const sendTemplateMessage = async ({ to, template, parameters = [] }) => {
  try {
    console.log('📤 Enviando mensaje con nueva API a:', to);
    
    // Usar la nueva función de la API que maneja imágenes de header correctamente
    const result = await apiSendTemplateMessage(to, template, parameters);
    
    console.log('✅ Mensaje enviado exitosamente:', result);
    return result;
    
  } catch (error) {
    console.error('💥 Error enviando mensaje:', error);
    throw error;
  }
};

/**
 * Envía mensajes en lote usando una plantilla
 * @param {Object} params - Parámetros del lote
 * @param {Array} params.messages - Lista de mensajes a enviar
 * @param {Object} params.template - Objeto de plantilla completo
 * @param {Array} params.fieldMappings - Mapeo de campos
 * @param {function} params.onProgress - Callback para progreso
 * @returns {Promise<Object>}
 */
export const sendBatchTemplateMessages = async ({ messages, template, fieldMappings, onProgress }) => {
  console.log('🚀 Iniciando envío en lote con nueva API:', {
    totalMessages: messages.length,
    templateName: template.name,
    templateLanguage: template.language,
    fieldMappings: fieldMappings.length
  });
  
  const results = {
    total: messages.length,
    sent: 0,
    failed: 0,
    errors: [],
    success: []
  };

  const BATCH_SIZE = 3; // Reducir más el tamaño del lote
  const DELAY = 3000; // Aumentar delay entre lotes

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    console.log(`📦 Procesando lote ${Math.floor(i/BATCH_SIZE) + 1} de ${Math.ceil(messages.length/BATCH_SIZE)} (${batch.length} mensajes)`);
    
    // Procesar lote actual
    const batchPromises = batch.map(async (message, index) => {
      try {
        console.log(`📱 Enviando mensaje ${i + index + 1}/${messages.length} a ${message.phoneNumber}`);
        
        // Extraer parámetros desde los datos de la fila
        const parameters = fieldMappings
          .sort((a, b) => a.parameterIndex - b.parameterIndex)
          .map(mapping => message.rowData[Object.keys(message.rowData)[mapping.columnIndex]] || '');
        
        console.log('📝 Parámetros extraídos:', parameters);
        
        const response = await sendTemplateMessage({
          to: message.phoneNumber,
          template: template,
          parameters: parameters
        });

        results.sent++;
        results.success.push({
          phoneNumber: message.phoneNumber,
          messageId: response.messages?.[0]?.id,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Mensaje ${i + index + 1} enviado exitosamente`);

      } catch (error) {
        results.failed++;
        results.errors.push({
          phoneNumber: message.phoneNumber,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        console.error(`❌ Mensaje ${i + index + 1} falló:`, error.message);
      }

      // Notificar progreso
      if (onProgress) {
        onProgress({
          processed: results.sent + results.failed,
          total: results.total,
          sent: results.sent,
          failed: results.failed
        });
      }
    });
    
    await Promise.all(batchPromises);

    // Esperar antes del siguiente lote para evitar límites de rate
    if (i + BATCH_SIZE < messages.length) {
      console.log(`⏳ Esperando ${DELAY/1000} segundos antes del siguiente lote...`);
      await new Promise(resolve => setTimeout(resolve, DELAY));
    }
  }
  
  console.log('🏁 Envío en lote completado:', results);
  return results;
};

/**
 * Formatea los parámetros para una plantilla
 * @param {Object} template - Plantilla seleccionada
 * @param {Array} values - Valores para los parámetros
 * @returns {Array} Componentes formateados para la API
 */
export const formatTemplateComponents = (template, values) => {
  const components = [];
  
  template.components.forEach(component => {
    // Solo procesar componentes que tienen parámetros
    if (component.parameters && component.parameters.length > 0) {
      // Ordenar parámetros por su índice real
      const sortedParams = [...component.parameters].sort((a, b) => a.index - b.index);
      
      const parameters = sortedParams.map(param => {
        // Usar el índice del parámetro menos 1 (ya que los índices empiezan en 1)
        const valueIndex = param.index - 1;
        const value = values[valueIndex];
        
        console.log(`📝 Parámetro {{${param.index}}} = "${value}"`);
        
        return {
          type: "text", // WhatsApp espera "text" para parámetros de texto
          text: String(value || '') // Asegurar que sea string
        };
      });
      
      components.push({
        type: component.type,
        parameters: parameters
      });
    }
  });
  
  console.log('🔧 Componentes formateados:', JSON.stringify(components, null, 2));
  return components;
};

/**
 * Prepara un mensaje para envío basado en mapeo de campos
 * @param {Object} params - Parámetros
 * @param {Object} params.template - Plantilla seleccionada
 * @param {Array} params.rowData - Datos de la fila de Excel
 * @param {Array} params.fieldMappings - Mapeo de campos
 * @returns {Object} Mensaje formateado
 */
export const prepareTemplateMessage = ({ template, rowData, fieldMappings }) => {
  // Ordenar mapeos por índice de parámetro
  const sortedMappings = [...fieldMappings].sort((a, b) => a.parameterIndex - b.parameterIndex);
  
  // Extraer valores en el orden correcto
  const values = sortedMappings.map(mapping => rowData[mapping.columnIndex]);
  
  // Formatear componentes
  const components = formatTemplateComponents(template, values);
  
  // Obtener número de teléfono (asumimos que es la primera columna)
  const phoneNumber = rowData[0];
  
  return {
    phoneNumber,
    components
  };
};
