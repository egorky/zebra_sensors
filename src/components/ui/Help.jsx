import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-8 border-b border-gray-200 pb-8 last:border-0 last:pb-0">
    <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
    <div className="text-gray-700 space-y-3 leading-relaxed text-sm sm:text-base">{children}</div>
  </section>
);

const Help = () => {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ayuda</h1>
      <p className="text-gray-600 mb-8">
        Guía de uso de esta aplicación. Los nombres de menús coinciden con la barra lateral. Para la URL de la API y la clave, usa{' '}
        <Link to="/config" className="text-blue-600 underline font-medium">
          Configuración
        </Link>{' '}
        o el archivo <code className="bg-gray-100 px-1 rounded text-sm">.env</code> del proyecto; el README en la raíz del repositorio amplía el despliegue y PM2.
      </p>

      <nav className="mb-10 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
        <p className="font-semibold text-gray-800 mb-2">En esta página</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>
            <a href="#requisitos" className="hover:underline">
              Requisitos y configuración
            </a>
          </li>
          <li>
            <a href="#enrolar" className="hover:underline">
              Enrolar sensores
            </a>
          </li>
          <li>
            <a href="#desenrolar" className="hover:underline">
              Desenrolar (eliminar enrolado)
            </a>
          </li>
          <li>
            <a href="#lista-sensores" className="hover:underline">
              Lista de sensores y filtros
            </a>
          </li>
          <li>
            <a href="#inicio" className="hover:underline">
              Panel Inicio
            </a>
          </li>
          <li>
            <a href="#tareas-crear" className="hover:underline">
              Crear tareas
            </a>
          </li>
          <li>
            <a href="#tareas-asociar" className="hover:underline">
              Asociar sensores a una tarea
            </a>
          </li>
          <li>
            <a href="#tareas-detener" className="hover:underline">
              Detener una tarea
            </a>
          </li>
          <li>
            <a href="#logs" className="hover:underline">
              Obtener logs de datos
            </a>
          </li>
          <li>
            <a href="#alarmas" className="hover:underline">
              Alarmas
            </a>
          </li>
          <li>
            <a href="#activos" className="hover:underline">
              Activos en la tarea
            </a>
          </li>
          <li>
            <a href="#tareas-filtros" className="hover:underline">
              Lista de tareas: búsqueda y filtros
            </a>
          </li>
        </ul>
      </nav>

      <div className="space-y-10">
        <Section id="requisitos" title="Requisitos y configuración">
          <p>
            Antes de usar <strong>Sensores</strong> o <strong>Tareas</strong>, define la <strong>Base URL</strong> de la API Zebra y la <strong>API Key</strong>{' '}
            en <Link to="/config" className="text-blue-600 underline">Configuración</Link>, o en el archivo <code className="bg-gray-100 px-1 rounded text-sm">.env</code>{' '}
            del proyecto (<code className="bg-gray-100 px-1 rounded text-sm">VITE_API_BASE_URL</code>, <code className="bg-gray-100 px-1 rounded text-sm">VITE_API_KEY</code>). Los valores guardados en el navegador tienen prioridad sobre el <code className="bg-gray-100 px-1 rounded text-sm">.env</code>.
          </p>
        </Section>

        <Section id="enrolar" title="Enrolar sensores">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Abre <Link to="/sensors" className="text-blue-600 underline">Sensores</Link>.
            </li>
            <li>
              En el bloque <strong>Enrolar Nuevo Sensor</strong>, escribe el <strong>número de serie</strong> del sensor (tal como lo exige la API de Zebra).
            </li>
            <li>
              Pulsa <strong>Enrolar</strong>. Si la operación es correcta, verás un mensaje de confirmación y la lista se actualizará al cabo de unos segundos (también puedes usar <strong>Refrescar</strong>).
            </li>
          </ol>
        </Section>

        <Section id="desenrolar" title="Desenrolar (eliminar el enrolado de un sensor)">
          <p>
            En <Link to="/sensors" className="text-blue-600 underline">Sensores</Link>, en cada fila de la tabla hay un botón <strong>Desenrolar</strong>. Al pulsarlo, la aplicación pide confirmación y llama a la API para solicitar el desenrolado del sensor por número de serie.
          </p>
          <p className="text-sm text-gray-600">
            Esto no borra el dispositivo físico; revoca el enrolado en tu tenant según las reglas de la plataforma Zebra.
          </p>
        </Section>

        <Section id="lista-sensores" title="Lista de sensores, búsqueda y filtros avanzados">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Buscar</strong>: filtra por texto (nombre, MAC o serial) y pulsa <strong>Buscar</strong> (o Enter en el campo).
            </li>
            <li>
              <strong>Paginación</strong>: tamaño de página y botones <strong>Anterior</strong> / <strong>Siguiente</strong>.
            </li>
            <li>
              <strong>Filtros avanzados</strong>: botón del mismo nombre; permite <code className="bg-gray-100 px-1 rounded text-sm">task_id</code>, estados, fechas de enrolado, exclusión de batería baja y <code className="bg-gray-100 px-1 rounded text-sm">sort_field</code> personalizado.
            </li>
            <li>
              Expande una fila (flecha) para ver <strong>detalles</strong> del sensor.
            </li>
          </ul>
        </Section>

        <Section id="inicio" title="Panel Inicio">
          <p>
            En <Link to="/" className="text-blue-600 underline">Inicio</Link> verás un resumen de sensores enrolados, la temperatura reciente conocida por el listado y un histórico breve cuando la API de lecturas responde. Usa <strong>Actualizar</strong> para refrescar; el enlace <strong>Gestionar sensores</strong> lleva a la pantalla completa de sensores.
          </p>
        </Section>

        <Section id="tareas-crear" title="Crear tareas">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Abre <Link to="/tasks" className="text-blue-600 underline">Tareas</Link>.
            </li>
            <li>
              Pulsa <strong>Crear Tarea</strong> y completa el formulario del modal (nombre, intervalos, umbrales de temperatura, tipo de sensor, notas, etc.).
            </li>
            <li>
              Confirma con <strong>Crear Tarea</strong> al pie del modal. La lista se actualiza al cerrar correctamente.
            </li>
          </ol>
        </Section>

        <Section id="tareas-asociar" title="Asociar sensores a una tarea">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              En <Link to="/tasks" className="text-blue-600 underline">Tareas</Link>, haz clic en una tarea para expandir el panel de detalle.
            </li>
            <li>
              En el desplegable, elige un sensor y pulsa <strong>Asociar sensor</strong>.
            </li>
            <li>
              Los detalles de la tarea se recargan para reflejar el nuevo estado.
            </li>
          </ol>
        </Section>

        <Section id="tareas-detener" title="Detener una tarea">
          <p>
            Con el detalle de la tarea expandido, pulsa <strong>Detener Tarea</strong>. La aplicación pide confirmación y llama a la API para detener el monitoreo de esa tarea.
          </p>
        </Section>

        <Section id="logs" title="Obtener logs de datos (reporting)">
          <p>
            En el detalle de una tarea expandido, bloque <strong>Log de datos (paginado por cursor)</strong>:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Ajusta el <strong>límite</strong> por petición (1–14000) y, si hace falta, <strong>startTime</strong>, <strong>endTime</strong>, <strong>sensorTaskId</strong> o <strong>deviceId</strong> según la documentación de Zebra.
            </li>
            <li>
              <strong>Cargar primera página</strong> obtiene el primer bloque de eventos.
            </li>
            <li>
              <strong>Cargar más (cursor)</strong> usa el cursor devuelto por la API para la página siguiente.
            </li>
            <li>
              Verás una <strong>tabla</strong> resumida y el desplegable <strong>JSON bruto (última página)</strong> con la respuesta más reciente.
            </li>
            <li>
              <strong>Limpiar vista</strong> borra el log acumulado en pantalla (no borra datos en Zebra).
            </li>
          </ul>
        </Section>

        <Section id="alarmas" title="Alarmas de la tarea">
          <p>
            En el mismo detalle, sección <strong>Alarmas (paginación por página)</strong>: <strong>Cargar página 1</strong> y <strong>Siguiente página</strong> van acumulando alarmas. Los datos se muestran en tabla; usa <strong>Limpiar vista</strong> para vaciar lo mostrado en pantalla.
          </p>
        </Section>

        <Section id="activos" title="Activos en la tarea">
          <p>
            Bloque <strong>Añadir activo a la tarea</strong>: rellena <strong>Identificador del activo</strong> y <strong>id_format</strong>, luego pulsa <strong>Añadir activo</strong>. La petición sigue el cuerpo esperado por la API de gestión Zebra.
          </p>
        </Section>

        <Section id="tareas-filtros" title="Lista de tareas: búsqueda y filtros">
          <p>
            En la cabecera de <strong>Tareas</strong> puedes buscar por nombre, ordenar, paginar y abrir <strong>Filtros avanzados</strong> (<code className="bg-gray-100 px-1 rounded text-sm">updated_from</code> / <code className="bg-gray-100 px-1 rounded text-sm">updated_to</code>, MAC del sensor, estados de tarea, <code className="bg-gray-100 px-1 rounded text-sm">sort_field</code> personalizado).
          </p>
        </Section>
      </div>

      <p className="mt-10 text-sm text-gray-500">
        Documentación ampliada del proyecto: carpeta <code className="bg-gray-100 px-1 rounded">docs/</code> (por ejemplo <code className="bg-gray-100 px-1 rounded">user_guide.md</code> y <code className="bg-gray-100 px-1 rounded">reference_zebra_apis.md</code>).
      </p>
    </div>
  );
};

export default Help;
