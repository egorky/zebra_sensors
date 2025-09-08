import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAllMessageTemplates, validateApiConfig } from '../services/whatsappApi';

const useAppStore = create(
  persist(
    (set, get) => ({
      // Estado inicial - siempre vacío para forzar carga desde API
      templates: [],
      selectedTemplate: null,
      excelData: null,
      fieldMappings: [],
      previewMessages: [],
      isLoading: false,
      error: null,
      currentStep: 1, // 1: Templates, 2: Excel, 3: Mapping, 4: Preview
      apiConfigValid: false,

      // Acciones para plantillas
      setTemplates: (templates) => set({ templates }),
      
      // Cargar plantillas desde la API
      loadTemplatesFromApi: async (options = {}) => {
        const { setLoading, setError, setTemplates } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          console.log('🔄 Loading templates from WhatsApp API...');
          
          // Validar configuración primero
          const isValid = await validateApiConfig();
          if (!isValid) {
            throw new Error('Configuración de API inválida. Verifica tus credenciales.');
          }
          
          set({ apiConfigValid: true });
          
          // Obtener plantillas
          const templates = await getAllMessageTemplates(options);
          
          console.log('✅ Templates loaded successfully:', templates.length);
          setTemplates(templates);
          
          return templates;
          
        } catch (error) {
          console.error('❌ Error loading templates:', error);
          setError(error.message || 'Error al cargar plantillas desde la API');
          set({ apiConfigValid: false });
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      // Refrescar plantillas
      refreshTemplates: async () => {
        const { loadTemplatesFromApi } = get();
        return loadTemplatesFromApi({ status: 'APPROVED' }); // Solo plantillas aprobadas
      },
      
      selectTemplate: (template) => set({ 
        selectedTemplate: template,
        fieldMappings: [], // Reset mappings when selecting new template
        previewMessages: []
      }),

      // Acciones para Excel
      setExcelData: (excelData) => set({ 
        excelData,
        fieldMappings: [], // Reset mappings when new Excel is loaded
        previewMessages: []
      }),

      clearExcelData: () => set({ 
        excelData: null,
        fieldMappings: [],
        previewMessages: []
      }),

      // Acciones para mapeo de campos
      setFieldMappings: (fieldMappings) => set({ fieldMappings }),
      
      addFieldMapping: (mapping) => set((state) => ({
        fieldMappings: [...state.fieldMappings.filter(m => m.parameterIndex !== mapping.parameterIndex), mapping]
      })),

      removeFieldMapping: (parameterIndex) => set((state) => ({
        fieldMappings: state.fieldMappings.filter(m => m.parameterIndex !== parameterIndex)
      })),

      // Acciones para vista previa
      setPreviewMessages: (previewMessages) => set({ previewMessages }),

      generatePreviewMessages: () => {
        const { selectedTemplate, excelData, fieldMappings } = get();
        
        if (!selectedTemplate || !excelData || fieldMappings.length === 0) {
          return;
        }

        const previewMessages = [];
        
        // Tomar todas las filas para la vista previa
        const previewRows = excelData.data;
        
        previewRows.forEach((row, index) => {
          const message = generateMessageFromTemplate(selectedTemplate, row, fieldMappings, excelData.headers);
          
          previewMessages.push({
            phoneNumber: row[0] || `+1234567890${index}`, // Asumir que la primera columna es el teléfono
            message: message.text,
            rowData: Object.fromEntries(excelData.headers.map((header, idx) => [header, row[idx]])),
            isValid: message.isValid,
            errors: message.errors
          });
        });

        set({ previewMessages });
      },

      // Acciones para navegación
      setCurrentStep: (step) => set({ currentStep: step }),
      
      nextStep: () => set((state) => ({ 
        currentStep: Math.min(4, state.currentStep + 1) 
      })),
      
      prevStep: () => set((state) => ({ 
        currentStep: Math.max(1, state.currentStep - 1) 
      })),

      // Acciones para loading y errores
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Reset completo
      reset: () => set({
        selectedTemplate: null,
        excelData: null,
        fieldMappings: [],
        previewMessages: [],
        currentStep: 1,
        error: null
      })
    }),
    {
      name: 'whatsapp-templates-storage',
      partialize: (state) => ({
        // NO persistir templates para forzar carga desde API
        selectedTemplate: state.selectedTemplate,
        fieldMappings: state.fieldMappings,
        currentStep: state.currentStep
      })
    }
  )
);

// Función auxiliar para generar mensajes desde plantillas
function generateMessageFromTemplate(template, rowData, fieldMappings, headers) {
  let message = '';
  let isValid = true;
  let errors = [];

  try {
    // Encontrar el componente BODY de la plantilla
    const bodyComponent = template.components.find(c => c.type === 'BODY');
    
    if (!bodyComponent) {
      return {
        text: 'Error: No se encontró el cuerpo de la plantilla',
        isValid: false,
        errors: ['Plantilla sin cuerpo']
      };
    }

    message = bodyComponent.text;

    // Reemplazar parámetros con datos del Excel
    fieldMappings.forEach(mapping => {
      // WhatsApp usa parámetros con índices basados en 1: {{1}}, {{2}}, etc.
      const placeholder = `{{${mapping.parameterIndex}}}`;
      const value = rowData[mapping.columnIndex] || '';
      
      if (!value && value !== 0) {
        errors.push(`Campo vacío para parámetro ${mapping.parameterIndex}`);
        isValid = false;
      }
      
      // Reemplazar todas las ocurrencias del placeholder
      const regex = new RegExp(`\\{\\{${mapping.parameterIndex}\\}\\}`, 'g');
      message = message.replace(regex, value);
    });

    // Verificar si quedan parámetros sin reemplazar
    const remainingParams = message.match(/\{\{\d+\}\}/g);
    if (remainingParams) {
      errors.push(`Parámetros sin mapear: ${remainingParams.join(', ')}`);
      isValid = false;
    }

  } catch (error) {
    isValid = false;
    errors.push(`Error generando mensaje: ${error.message}`);
  }

  return {
    text: message,
    isValid,
    errors
  };
}

export default useAppStore;
