import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-8 border-b border-gray-200 pb-8 last:border-0 last:pb-0">
    <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
    <div className="text-gray-700 space-y-3 leading-relaxed text-sm sm:text-base">{children}</div>
  </section>
);

const Help = () => {
  const { isAdmin } = useAuth();
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ayuda</h1>
      <p className="text-gray-600 mb-8">
        Guía de uso de esta aplicación. Los nombres de menús coinciden con la barra lateral.{' '}
        {isAdmin ? (
          <>
            Para la URL de la API de Zebra y la clave de aplicación, usa{' '}
            <Link to="/config" className="text-blue-600 underline font-medium">
              Configuración
            </Link>{' '}
            o define valores por defecto en el archivo <code className="bg-gray-100 px-1 rounded text-sm">.env</code> del despliegue (<code className="bg-gray-100 px-1 rounded text-sm">VITE_API_BASE_URL</code>, <code className="bg-gray-100 px-1 rounded text-sm">VITE_API_KEY</code>).
          </>
        ) : (
          <>
            La URL de la API y la clave de aplicación las configura un administrador; en tu sesión se usan los valores ya guardados en este navegador o, si no hay ninguno, los del <code className="bg-gray-100 px-1 rounded text-sm">.env</code> con el que se compiló la app.
          </>
        )}
      </p>

      <nav className="mb-10 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
        <p className="font-semibold text-gray-800 mb-2">En esta página</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>
            <a href="#almacenamiento" className="hover:underline">
              Dónde se guarda la información
            </a>
          </li>
          <li>
            <a href="#acceso-usuarios" className="hover:underline">
              Acceso, usuarios y roles
            </a>
          </li>
          <li>
            <a href="#sesion" className="hover:underline">
              Inicio de sesión y cierre
            </a>
          </li>
          <li>
            <a href="#requisitos" className="hover:underline">
              Requisitos y configuración (API y apariencia)
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
          <li>
            <a href="#ejecucion" className="hover:underline">
              Desarrollo y despliegue del front
            </a>
          </li>
        </ul>
      </nav>

      <div className="space-y-10">
        <Section id="almacenamiento" title="Dónde se guarda la información">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Datos en vivo de Zebra</strong> (listado de sensores, tareas, enrolados, logs, etc.): <strong>no se guardan en este proyecto</strong> salvo en memoria mientras usas la pantalla. Siempre se obtienen o envían mediante las APIs de Zebra Data Services.
            </li>
            <li>
              <strong>Navegador (localStorage)</strong>: la <strong>configuración de conexión</strong> a Zebra (Base URL, API key) y el <strong>branding</strong> (logo, favicon) si los guardas desde la interfaz. La <strong>sesión de login</strong> (token JWT) también se guarda aquí.
            </li>
            <li>
              <strong>Servidor Node con SQLite</strong> (<code className="bg-gray-100 px-1 rounded text-sm">server/</code>, URL <code className="bg-gray-100 px-1 rounded text-sm">VITE_BACKEND_URL</code> en el front): <strong>usuarios</strong> (hash de contraseña) y <strong>copia de listados</strong> de sensores y tareas cuando un administrador refresca esas pantallas (respaldo ligero; la fuente de verdad sigue siendo Zebra).
            </li>
          </ul>
        </Section>

        <Section id="acceso-usuarios" title="Acceso, nuevos usuarios y roles">
          <p>
            El login valida usuario y contraseña contra la <strong>base SQLite</strong> del API Node y devuelve un <strong>JWT</strong>. En el <code className="bg-gray-100 px-1 rounded text-sm">.env</code> del front debe figurar <code className="bg-gray-100 px-1 rounded text-sm">VITE_BACKEND_URL</code> apuntando a ese servidor (mismo host/puerto que <code className="bg-gray-100 px-1 rounded text-sm">PORT</code> en <code className="bg-gray-100 px-1 rounded text-sm">server/.env</code>). Los administradores gestionan cuentas en el menú <strong>Usuarios</strong>.
          </p>
          <p>
            El primer arranque del servidor crea un administrador con <code className="bg-gray-100 px-1 rounded text-sm">BOOTSTRAP_ADMIN_USERNAME</code> y <code className="bg-gray-100 px-1 rounded text-sm">BOOTSTRAP_ADMIN_PASSWORD</code> en <code className="bg-gray-100 px-1 rounded text-sm">server/.env</code> si la tabla de usuarios está vacía (por defecto <code className="bg-gray-100 px-1 rounded text-sm">admin</code> / <code className="bg-gray-100 px-1 rounded text-sm">changeme</code>). Ese primer acceso <strong>debe cambiar la contraseña</strong> antes de usar el resto de la aplicación.
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="py-2 px-3 border-b">Rol</th>
                  <th className="py-2 px-3 border-b">Qué puede hacer en esta GUI</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium whitespace-nowrap">administrador (<code className="bg-gray-100 px-1 rounded">admin</code>)</td>
                  <td className="py-2 px-3">
                    Todo: menú <strong>Configuración</strong> (URL de API, clave, logo y favicon), enrolar y desenrolar sensores, crear y detener tareas, asociar sensores, añadir activos, consultar logs y alarmas.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium whitespace-nowrap">operador (<code className="bg-gray-100 px-1 rounded">operator</code>)</td>
                  <td className="py-2 px-3">
                    Solo lectura y consulta: <strong>Inicio</strong>, <strong>Sensores</strong> y <strong>Tareas</strong> (listados, detalles, logs y alarmas). No ve Configuración ni acciones que modifiquen Zebra (enrolar, desenrolar, crear o detener tareas, asociar sensores ni añadir activos).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="sesion" title="Inicio de sesión y cierre de sesión">
          <p>
            En la pantalla de login introduce usuario y contraseña. La sesión (JWT) dura del orden de <strong>24 horas</strong>; cuando caduque, vuelve a identificarte.
          </p>
          <p>
            <strong>Cerrar sesión</strong>: botón al pie del menú lateral. En la barra lateral también se muestra tu rol (Administrador u Operador) y, si está disponible, tu nombre de usuario.
          </p>
        </Section>

        <Section id="requisitos" title="Requisitos y configuración (API y apariencia)">
          <p>
            Los operadores usan la misma URL y clave de Zebra que ya estén guardadas en el navegador o las del <code className="bg-gray-100 px-1 rounded text-sm">.env</code>; solo un <strong>administrador</strong> puede abrir la pantalla de{' '}
            {isAdmin ? <Link to="/config" className="text-blue-600 underline">Configuración</Link> : <strong>Configuración</strong>} para cambiarlas.
          </p>
          <p>
            La clave de aplicación de Zebra se obtiene en el{' '}
            <a href="https://developer.zebra.com/user/apps" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              portal para desarrolladores Zebra
            </a>
            . La <strong>Base URL</strong> y la <strong>API Key</strong> por defecto pueden definirse en <code className="bg-gray-100 px-1 rounded text-sm">.env</code> con <code className="bg-gray-100 px-1 rounded text-sm">VITE_API_BASE_URL</code> y <code className="bg-gray-100 px-1 rounded text-sm">VITE_API_KEY</code>. Lo guardado desde la interfaz en el navegador <strong>sustituye</strong> a esos valores por defecto.
          </p>
          <p>
            Opcionalmente puedes subir <strong>logo</strong> y <strong>favicon</strong>; se almacenan en el navegador como datos en base64 (evita ficheros muy grandes; por encima de unos <strong>400 KB</strong> por archivo puedes notar lentitud o límites de almacenamiento). <strong>Limpiar configuración guardada</strong> borra del navegador URL, clave, logo y favicon guardados; a partir de ahí vuelven a aplicarse los del <code className="bg-gray-100 px-1 rounded text-sm">.env</code> si existen.
          </p>
          <p className="text-sm text-gray-600">
            Si cambias cualquier variable <code className="bg-gray-100 px-1 rounded text-sm">VITE_*</code> en <code className="bg-gray-100 px-1 rounded text-sm">.env</code>, hay que <strong>volver a ejecutar</strong> <code className="bg-gray-100 px-1 rounded text-sm">npm run dev</code> o <code className="bg-gray-100 px-1 rounded text-sm">npm run build</code> según el modo, porque Vite las inyecta en el cliente en tiempo de compilación.
          </p>
        </Section>

        <Section id="enrolar" title="Enrolar sensores">
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Solo usuarios con rol <strong>administrador</strong>. Los operadores ven la lista pero no el formulario de enrolado.
          </p>
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
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Solo <strong>administrador</strong>; los operadores no ven la columna de acciones de desenrolado.
          </p>
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
              <strong>Buscar</strong>: el texto se envía a la API como filtro (nombre, MAC o número de serie). Pulsa <strong>Buscar</strong> o Enter en el campo.
            </li>
            <li>
              <strong>Paginación</strong>: tamaño de página y botones <strong>Anterior</strong> / <strong>Siguiente</strong>.
            </li>
            <li>
              <strong>Filtros avanzados</strong>: <code className="bg-gray-100 px-1 rounded text-sm">task_id</code>, estados del dispositivo, estados del sensor dentro de la tarea (útiles combinados con <code className="bg-gray-100 px-1 rounded text-sm">task_id</code>), fechas de enrolado, exclusión de batería baja y campo de orden personalizado.
            </li>
            <li>
              Expande una fila (flecha) para ver <strong>detalles</strong> del sensor.
            </li>
            <li>
              Si la <strong>última temperatura</strong> aparece como no válida (por ejemplo ~327,67 °C), puede deberse a que el sensor sale de reposo; es un comportamiento descrito por Zebra para ciertos estados.
            </li>
          </ul>
        </Section>

        <Section id="inicio" title="Panel Inicio">
          <p>
            En <Link to="/" className="text-blue-600 underline">Inicio</Link> verás un resumen de sensores enrolados, la temperatura reciente conocida por el listado y un histórico breve cuando la API de lecturas responde. Usa <strong>Actualizar</strong> para refrescar; el enlace <strong>Gestionar sensores</strong> lleva a la pantalla completa de sensores.
          </p>
        </Section>

        <Section id="tareas-crear" title="Crear tareas">
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Solo <strong>administrador</strong>; el botón <strong>Crear Tarea</strong> no aparece para operadores.
          </p>
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
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Solo <strong>administrador</strong>.
          </p>
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
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Solo <strong>administrador</strong>.
          </p>
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
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Solo <strong>administrador</strong>.
          </p>
          <p>
            Bloque <strong>Añadir activo a la tarea</strong>: rellena <strong>Identificador del activo</strong> y <strong>id_format</strong>, luego pulsa <strong>Añadir activo</strong>. La petición sigue el cuerpo esperado por la API de gestión Zebra.
          </p>
        </Section>

        <Section id="tareas-filtros" title="Lista de tareas: búsqueda y filtros">
          <p>
            En la cabecera de <strong>Tareas</strong> puedes buscar por nombre, ordenar, paginar y abrir <strong>Filtros avanzados</strong> (<code className="bg-gray-100 px-1 rounded text-sm">updated_from</code> / <code className="bg-gray-100 px-1 rounded text-sm">updated_to</code>, MAC del sensor, estados de tarea, <code className="bg-gray-100 px-1 rounded text-sm">sort_field</code> personalizado). Algunos valores de orden extra pueden no estar soportados en todos los entornos Zebra.
          </p>
        </Section>

        <Section id="ejecucion" title="Desarrollo y despliegue">
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>API Node + SQLite</strong>: desde la raíz, <code className="bg-gray-100 px-1 rounded text-sm">npm run server:install</code> una vez y <code className="bg-gray-100 px-1 rounded text-sm">npm run server:dev</code> para el backend. Configuración en <code className="bg-gray-100 px-1 rounded text-sm">server/.env</code> (puerto <code className="bg-gray-100 px-1 rounded text-sm">PORT</code>, típicamente 3001).
            </li>
            <li>
              <strong>Front en desarrollo</strong>: <code className="bg-gray-100 px-1 rounded text-sm">npm run dev</code>. Host y puerto del servidor Vite: <code className="bg-gray-100 px-1 rounded text-sm">DEV_HOST</code> y <code className="bg-gray-100 px-1 rounded text-sm">DEV_PORT</code> en el <code className="bg-gray-100 px-1 rounded text-sm">.env</code> de la raíz.
            </li>
            <li>
              <strong>Servir la SPA compilada</strong>: <code className="bg-gray-100 px-1 rounded text-sm">npm run build</code> genera <code className="bg-gray-100 px-1 rounded text-sm">dist/</code>; <code className="bg-gray-100 px-1 rounded text-sm">npm start</code> compila y ejecuta el servidor estático de Vite. Host y puerto: <code className="bg-gray-100 px-1 rounded text-sm">HOST</code> y <code className="bg-gray-100 px-1 rounded text-sm">PORT</code> en el mismo <code className="bg-gray-100 px-1 rounded text-sm">.env</code>. Opcional: <code className="bg-gray-100 px-1 rounded text-sm">ALLOWED_HOSTS</code>.
            </li>
            <li>
              En servidor puedes usar PM2 u otro supervisor sobre el proceso del front y/o el del API Node.
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
};

export default Help;
