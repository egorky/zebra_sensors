// Script para limpiar el localStorage y forzar la recarga de plantillas desde la API
console.log('🧹 Limpiando localStorage...');

// Limpiar específicamente el storage de la aplicación
localStorage.removeItem('whatsapp-templates-storage');

// También limpiar cualquier otro storage relacionado
Object.keys(localStorage).forEach(key => {
  if (key.includes('whatsapp') || key.includes('template')) {
    console.log(`Eliminando: ${key}`);
    localStorage.removeItem(key);
  }
});

console.log('✅ LocalStorage limpiado. Las plantillas se cargarán desde la API.');
console.log('🔄 Recarga la página para ver los cambios.');
