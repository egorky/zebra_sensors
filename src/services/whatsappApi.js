// Servicio para interactuar con Meta WhatsApp Cloud API

const WHATSAPP_ACCESS_TOKEN = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_VERSION = import.meta.env.VITE_WHATSAPP_API_VERSION;
const META_WABA_ID = import.meta.env.VITE_META_WABA_ID;
const DEFAULT_HEADER_IMAGE_URL = import.meta.env.VITE_DEFAULT_HEADER_IMAGE_URL;

const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

/**
 * Configuración base para las peticiones HTTP
 */
const apiConfig = {
  headers: {
    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
};

/**
 * Manejo de errores de la API
 * @param {Response} response 
 * @returns {Promise<any>}
 */
const handleApiResponse = async (response) => {
  console.log(`📡 API Response: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    let errorData = {};
    let errorText = '';
    
    try {
      const responseText = await response.text();
      errorText = responseText;
      
      if (responseText) {
        errorData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.warn('Could not parse error response as JSON:', errorText);
      errorData = { error: { message: errorText || response.statusText } };
    }
    
    const errorMessage = errorData.error?.message || 
                        errorData.message || 
                        errorText || 
                        `HTTP ${response.status}: ${response.statusText}`;
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.code = errorData.error?.code;
    error.subcode = errorData.error?.error_subcode;
    error.details = errorData.error || errorData;
    error.rawResponse = errorText;
    
    console.error('❌ API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      errorText
    });
    
    throw error;
  }
  
  const data = await response.json();
  console.log('✅ API Response Data:', data);
  return data;
};

/**
 * Obtiene todas las plantillas de mensajes de la cuenta de WhatsApp Business
 * @param {Object} options - Opciones de filtrado
 * @param {string} options.status - Filtrar por estado (APPROVED, PENDING, REJECTED)
 * @param {string} options.category - Filtrar por categoría (MARKETING, UTILITY, AUTHENTICATION)
 * @param {string} options.language - Filtrar por idioma (es, en, pt, etc.)
 * @param {number} options.limit - Límite de resultados (por defecto 100)
 * @returns {Promise<Array>}
 */
export const getMessageTemplates = async (options = {}) => {
  try {
    const {
      status,
      category,
      language,
      limit = 100,
      after = null
    } = options;

    // Construir parámetros de consulta
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    if (status) params.append('status', status);
    if (category) params.append('category', category);
    if (language) params.append('language', language);
    if (after) params.append('after', after);

    const url = `${BASE_URL}/${META_WABA_ID}/message_templates?${params.toString()}`;
    
    console.log('🔍 Fetching templates from:', url);
    
    const response = await fetch(url, apiConfig);
    const data = await handleApiResponse(response);
    
    console.log('✅ Templates fetched successfully:', data.data?.length || 0, 'templates');
    
    return {
      templates: data.data || [],
      paging: data.paging || null,
      total: data.data?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    
    // Si es un error de autenticación, devolver información específica
    if (error.status === 401 || error.code === 190) {
      throw new Error('Token de acceso inválido o expirado. Verifica tu WHATSAPP_ACCESS_TOKEN.');
    }
    
    // Si es un error de permisos
    if (error.status === 403) {
      throw new Error('Sin permisos para acceder a las plantillas. Verifica los permisos de tu aplicación.');
    }
    
    // Si es un error de configuración
    if (error.status === 404) {
      throw new Error('WABA ID no encontrado. Verifica tu META_WABA_ID.');
    }
    
    throw error;
  }
};

/**
 * Obtiene una plantilla específica por su ID
 * @param {string} templateId - ID de la plantilla
 * @returns {Promise<Object>}
 */
export const getMessageTemplate = async (templateId) => {
  try {
    const url = `${BASE_URL}/${templateId}`;
    
    const response = await fetch(url, apiConfig);
    const data = await handleApiResponse(response);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching template:', templateId, error);
    throw error;
  }
};

/**
 * Transforma una plantilla de la API a nuestro formato interno
 * @param {Object} apiTemplate - Plantilla desde la API
 * @returns {Object}
 */
export const transformApiTemplate = (apiTemplate) => {
  try {
    console.log('🔄 Transforming template:', {
      id: apiTemplate.id,
      name: apiTemplate.name,
      status: apiTemplate.status,
      componentsCount: apiTemplate.components?.length || 0
    });
    
    const transformed = {
      id: apiTemplate.id,
      name: apiTemplate.name,
      language: apiTemplate.language,
      status: apiTemplate.status,
      category: apiTemplate.category,
      components: transformComponents(apiTemplate.components || []),
      createdAt: new Date().toISOString(), // La API no siempre devuelve estas fechas
      updatedAt: new Date().toISOString(),
      // Campos adicionales de la API
      quality_score: apiTemplate.quality_score,
      rejected_reason: apiTemplate.rejected_reason,
      previous_category: apiTemplate.previous_category,
      // Datos raw para debugging
      _rawApiData: apiTemplate
    };
    
    console.log('✅ Template transformed:', {
      id: transformed.id,
      name: transformed.name,
      componentsTransformed: transformed.components.length,
      totalParameters: transformed.components.reduce((acc, c) => acc + (c.parameters?.length || 0), 0)
    });
    
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming template:', {
      templateId: apiTemplate.id,
      templateName: apiTemplate.name,
      error: error.message,
      rawTemplate: apiTemplate
    });
    return null;
  }
};

/**
 * Transforma los componentes de la API a nuestro formato
 * @param {Array} apiComponents - Componentes desde la API
 * @returns {Array}
 */
const transformComponents = (apiComponents) => {
  return apiComponents.map(component => {
    const transformed = {
      type: component.type,
      format: component.format || 'TEXT',
      text: component.text || '',
      parameters: []
    };
    
    // Manejar componentes HEADER con imágenes
    if (component.type === 'HEADER' && component.format === 'IMAGE') {
      console.log('📸 Processing HEADER component with IMAGE format');
      
      // Si el header requiere una imagen, usar la URL por defecto
      transformed.imageUrl = DEFAULT_HEADER_IMAGE_URL;
      transformed.hasImage = true;
      
      // Si hay parámetros de ejemplo para la imagen, también los procesamos
      if (component.example && component.example.header_handle) {
        transformed.exampleImageUrl = component.example.header_handle[0];
      }
      
      console.log('✅ Header image configured:', {
        defaultUrl: DEFAULT_HEADER_IMAGE_URL,
        exampleUrl: transformed.exampleImageUrl
      });
    }

    // Extraer parámetros del texto si existen
    if (component.text) {
      const parameterMatches = component.text.match(/\{\{(\d+)\}\}/g);
      if (parameterMatches) {
        // Crear set para evitar duplicados y ordenar
        const uniqueParams = [...new Set(parameterMatches)].sort();
        transformed.parameters = uniqueParams.map(match => {
          const index = parseInt(match.match(/\d+/)[0]);
          return {
            type: 'TEXT',
            index: index,
            text: match,
            // Agregar información de validación
            required: true
          };
        });
      }
    }
    
    // También manejar parámetros desde el campo 'example' si existe
    if (component.example && component.example.body_text && component.example.body_text.length > 0) {
      // Si no hay parámetros extraídos del texto pero hay ejemplos, inferir parámetros
      if (!transformed.parameters || transformed.parameters.length === 0) {
        transformed.parameters = component.example.body_text.map((example, idx) => ({
          type: 'TEXT',
          index: idx + 1, // WhatsApp usa índices basados en 1
          text: `{{${idx + 1}}}`,
          required: true,
          example: example
        }));
      } else {
        // Agregar ejemplos a parámetros existentes
        transformed.parameters.forEach((param, idx) => {
          if (component.example.body_text[idx]) {
            param.example = component.example.body_text[idx];
          }
        });
      }
    }

    // Manejar botones si existen
    if (component.buttons) {
      transformed.buttons = component.buttons;
    }

    // Manejar ejemplos si existen
    if (component.example) {
      transformed.example = component.example;
    }

    return transformed;
  });
};

/**
 * Obtiene información de la cuenta de WhatsApp Business
 * @returns {Promise<Object>}
 */
export const getWABAInfo = async () => {
  try {
    // Solicitar solo campos básicos que sabemos que existen
    const url = `${BASE_URL}/${META_WABA_ID}?fields=id,name,account_review_status,business_verification_status,message_template_namespace`;
    
    console.log('🔍 Fetching WABA info from:', url);
    
    const response = await fetch(url, apiConfig);
    const data = await handleApiResponse(response);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching WABA info:', error);
    throw error;
  }
};

/**
 * Prueba simple de conexión - solo valida el token
 * @returns {Promise<Object>}
 */
export const testConnection = async () => {
  try {
    console.log('🧪 Testing basic API connection...');
    
    const url = `${BASE_URL}/me`;
    console.log('Testing with URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await handleApiResponse(response);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { success: false, error: error.message, details: error };
  }
};

/**
 * Prueba específica para obtener plantillas
 * @returns {Promise<Object>}
 */
export const testTemplatesAccess = async () => {
  try {
    console.log('🔍 Testing templates access...');
    
    // Probar con límite pequeño primero
    const url = `${BASE_URL}/${META_WABA_ID}/message_templates?limit=5`;
    console.log('Testing templates URL:', url);
    
    const response = await fetch(url, apiConfig);
    console.log('Templates response status:', response.status);
    
    const data = await handleApiResponse(response);
    
    return {
      success: true,
      templatesCount: data.data?.length || 0,
      templates: data.data || [],
      paging: data.paging,
      rawData: data
    };
    
  } catch (error) {
    console.error('❌ Templates access test failed:', error);
    return {
      success: false,
      error: error.message,
      details: error,
      templatesCount: 0
    };
  }
};

/**
 * Valida la configuración de la API
 * @returns {Promise<boolean>}
 */
export const validateApiConfig = async () => {
  try {
    console.log('🔍 Validating API configuration...');
    
    // Verificar que tenemos todos los datos necesarios
    if (!WHATSAPP_ACCESS_TOKEN) {
      throw new Error('WHATSAPP_ACCESS_TOKEN no está configurado');
    }
    
    if (!META_WABA_ID) {
      throw new Error('META_WABA_ID no está configurado');
    }
    
    // Primero probar conexión básica
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`Conexión fallida: ${connectionTest.error}`);
    }
    
    // Luego probar con WABA info
    await getWABAInfo();
    
    console.log('✅ API configuration is valid');
    return true;
    
  } catch (error) {
    console.error('❌ API configuration validation failed:', error);
    throw error;
  }
};

/**
 * Obtiene plantillas con paginación automática
 * @param {Object} options - Opciones de filtrado
 * @returns {Promise<Array>}
 */
export const getAllMessageTemplates = async (options = {}) => {
  try {
    let allTemplates = [];
    let hasNextPage = true;
    let after = null;
    let pageCount = 0;
    const maxPages = 10; // Límite de seguridad
    
    while (hasNextPage && pageCount < maxPages) {
      const result = await getMessageTemplates({
        ...options,
        after,
        limit: 100
      });
      
      allTemplates = allTemplates.concat(result.templates);
      
      if (result.paging?.next) {
        after = result.paging.cursors?.after;
        pageCount++;
      } else {
        hasNextPage = false;
      }
    }
    
    console.log(`📊 Total templates fetched: ${allTemplates.length} (${pageCount + 1} pages)`);
    
    return allTemplates.map(transformApiTemplate).filter(Boolean);
    
  } catch (error) {
    console.error('❌ Error fetching all templates:', error);
    throw error;
  }
};

/**
 * Envía un mensaje usando una plantilla
 * @param {string} to - Número de teléfono destino
 * @param {Object} template - Plantilla a usar
 * @param {Array} parameters - Parámetros para la plantilla
 * @returns {Promise<Object>}
 */
export const sendTemplateMessage = async (to, template, parameters = []) => {
  try {
    console.log('📤 Sending template message:', {
      to,
      templateName: template.name,
      parametersCount: parameters.length
    });
    
    const url = `${BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    // Construir el payload del mensaje
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: template.name,
        language: {
          code: template.language
        }
      }
    };
    
    // Agregar componentes si hay parámetros o imágenes
    const components = [];
    
    // Manejar header con imagen
    const headerComponent = template.components.find(c => c.type === 'HEADER');
    if (headerComponent && (headerComponent.hasImage || headerComponent.format === 'IMAGE')) {
      console.log('📸 Adding header image component');
      
      // Usar URL desde localStorage si está disponible, sino usar la por defecto
      const savedImageUrl = localStorage.getItem('whatsapp-header-image-url');
      const imageUrl = savedImageUrl || headerComponent.imageUrl || DEFAULT_HEADER_IMAGE_URL;
      
      console.log('🖼️ Using image URL:', imageUrl);
      
      // Verificar que la URL sea válida
      try {
        new URL(imageUrl);
        console.log('✅ Image URL is valid');
      } catch (error) {
        console.error('❌ Invalid image URL:', imageUrl);
        throw new Error(`URL de imagen inválida: ${imageUrl}`);
      }
      
      components.push({
        type: 'header',
        parameters: [{
          type: 'image',
          image: {
            link: imageUrl
          }
        }]
      });
    }
    
    // Manejar parámetros del body
    const bodyComponent = template.components.find(c => c.type === 'BODY');
    if (bodyComponent && parameters.length > 0) {
      console.log('📝 Adding body parameters:', parameters.length);
      components.push({
        type: 'body',
        parameters: parameters.map(param => ({
          type: 'text',
          text: String(param)
        }))
      });
    }
    
    // Solo agregar componentes si hay alguno
    if (components.length > 0) {
      messagePayload.template.components = components;
    }
    
    console.log('📦 Message payload:', JSON.stringify(messagePayload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: apiConfig.headers,
      body: JSON.stringify(messagePayload)
    });
    
    const data = await handleApiResponse(response);
    
    console.log('✅ Message sent successfully:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error sending template message:', error);
    throw error;
  }
};

// Exportar configuración para debugging
export const getApiConfig = () => ({
  accessToken: WHATSAPP_ACCESS_TOKEN ? `${WHATSAPP_ACCESS_TOKEN.substring(0, 10)}...` : 'Not set',
  phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
  apiVersion: WHATSAPP_API_VERSION,
  wabaId: META_WABA_ID,
  baseUrl: BASE_URL,
  defaultHeaderImageUrl: DEFAULT_HEADER_IMAGE_URL
});
