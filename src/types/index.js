// Tipos de datos para el proyecto

/**
 * @typedef {Object} WhatsAppTemplate
 * @property {string} id - ID único de la plantilla
 * @property {string} name - Nombre de la plantilla
 * @property {string} language - Idioma de la plantilla
 * @property {string} status - Estado de la plantilla (APPROVED, PENDING, REJECTED)
 * @property {string} category - Categoría de la plantilla
 * @property {TemplateComponent[]} components - Componentes de la plantilla
 * @property {string} createdAt - Fecha de creación
 * @property {string} updatedAt - Fecha de actualización
 */

/**
 * @typedef {Object} TemplateComponent
 * @property {string} type - Tipo de componente (HEADER, BODY, FOOTER, BUTTONS)
 * @property {string} format - Formato del componente (TEXT, IMAGE, VIDEO, DOCUMENT)
 * @property {string} text - Texto del componente
 * @property {TemplateParameter[]} parameters - Parámetros del componente
 */

/**
 * @typedef {Object} TemplateParameter
 * @property {string} type - Tipo de parámetro (TEXT, CURRENCY, DATE_TIME)
 * @property {string} text - Texto del parámetro
 * @property {number} index - Índice del parámetro (1, 2, 3, etc.)
 */

/**
 * @typedef {Object} ExcelData
 * @property {string[][]} data - Datos del Excel como matriz
 * @property {string[]} headers - Encabezados de las columnas
 * @property {string} fileName - Nombre del archivo
 * @property {number} totalRows - Total de filas
 */

/**
 * @typedef {Object} FieldMapping
 * @property {number} parameterIndex - Índice del parámetro en la plantilla
 * @property {number} columnIndex - Índice de la columna en el Excel
 * @property {string} columnName - Nombre de la columna
 * @property {string} parameterType - Tipo del parámetro (TEXT, CURRENCY, DATE_TIME)
 */

/**
 * @typedef {Object} PreviewMessage
 * @property {string} phoneNumber - Número de teléfono del destinatario
 * @property {string} message - Mensaje personalizado
 * @property {Object} rowData - Datos de la fila del Excel
 * @property {boolean} isValid - Si el mensaje es válido
 * @property {string[]} errors - Errores de validación
 */

/**
 * @typedef {Object} AppState
 * @property {WhatsAppTemplate[]} templates - Lista de plantillas
 * @property {WhatsAppTemplate|null} selectedTemplate - Plantilla seleccionada
 * @property {ExcelData|null} excelData - Datos del Excel cargado
 * @property {FieldMapping[]} fieldMappings - Mapeos de campos
 * @property {PreviewMessage[]} previewMessages - Mensajes de vista previa
 * @property {boolean} isLoading - Estado de carga
 * @property {string|null} error - Error actual
 */

export {
  // Los tipos se exportan como comentarios JSDoc para uso en JavaScript
};
