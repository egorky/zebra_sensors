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
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ayuda</h1>
      <p className="text-gray-600 mb-8 text-sm sm:text-base">
        Guía de uso de esta aplicación. En pantallas pequeñas el menú se abre con el icono de <strong>menú</strong> arriba a la izquierda; en escritorio sigue visible a la izquierda. Para la URL de la API de Zebra y la clave, usa{' '}
        <Link to="/config" className="text-blue-600 underline font-medium">
          Configuración
        </Link>{' '}
        o define por defecto <code className="bg-gray-100 px-1 rounded text-sm">ZEBRA_API_BASE_URL</code> y <code className="bg-gray-100 px-1 rounded text-sm">ZEBRA_API_KEY</code> en el{' '}
        <code className="bg-gray-100 px-1 rounded text-sm">.env</code> (se inyectan al compilar). Lo guardado en el navegador sustituye a esos valores por defecto.
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
              <strong>Servidor Node con SQLite</strong> (<code className="bg-gray-100 px-1 rounded text-sm">server/</code>, rutas <code className="bg-gray-100 px-1 rounded text-sm">/api</code> en el mismo puerto que la web): <strong>usuarios</strong> (hash de contraseña) y <strong>copia de listados</strong> de sensores y tareas cuando un usuario con permisos de gestión refresca esas pantallas (respaldo ligero; la fuente de verdad sigue siendo Zebra).
            </li>
          </ul>
        </Section>

        <Section id="acceso-usuarios" title="Acceso, nuevos usuarios y roles">
          <p>
            El login valida usuario y contraseña contra la <strong>base SQLite</strong> y devuelve un <strong>JWT</strong>; el cliente llama a <code className="bg-gray-100 px-1 rounded text-sm">/api/…</code> en el mismo origen, salvo que definas <code className="bg-gray-100 px-1 rounded text-sm">VITE_BACKEND_URL</code> para un API en otro host. Los administradores gestionan cuentas en el menú <strong>Usuarios</strong>.
          </p>
          <p>
            El primer arranque del servidor crea un administrador con <code className="bg-gray-100 px-1 rounded text-sm">BOOTSTRAP_ADMIN_USERNAME</code> y <code className="bg-gray-100 px-1 rounded text-sm">BOOTSTRAP_ADMIN_PASSWORD</code> en el <code className="bg-gray-100 px-1 rounded text-sm">.env</code> de la raíz si la tabla de usuarios está vacía (por defecto <code className="bg-gray-100 px-1 rounded text-sm">admin</code> / <code className="bg-gray-100 px-1 rounded text-sm">changeme</code>). Ese primer acceso <strong>debe cambiar la contraseña</strong> antes de usar el resto de la aplicación.
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
                    Igual que operador en Zebra (configuración, sensores, tareas, logs, alarmas, activos) <strong>más</strong> el menú <strong>Usuarios</strong> para crear y eliminar cuentas de acceso a esta aplicación.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium whitespace-nowrap">operador (<code className="bg-gray-100 px-1 rounded">operator</code>)</td>
                  <td className="py-2 px-3">
                    <strong>Inicio</strong>, <strong>Configuración</strong> (URL y clave de Zebra, branding), <strong>Sensores</strong> y <strong>Tareas</strong>: enrolar y desenrolar, crear y detener tareas, asociar sensores, añadir activos, listados, detalles, logs y alarmas. <strong>No</strong> puede abrir <strong>Usuarios</strong> ni crear o borrar cuentas de la app.
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
            <strong>Cerrar sesión</strong>: botón al pie del menú. En el menú lateral (o el panel deslizante en móvil) también se muestra tu rol (Administrador u Operador) y, si está disponible, tu nombre de usuario.
          </p>
        </Section>

        <Section id="requisitos" title="Requisitos y configuración (API y apariencia)">
          <p>
            Cualquier usuario autenticado puede abrir <Link to="/config" className="text-blue-600 underline">Configuración</Link> para cambiar la URL y la clave de Zebra (y el branding) en este navegador; si no guardas nada, se usan los valores de <code className="bg-gray-100 px-1 rounded text-sm">ZEBRA_API_BASE_URL</code> y <code className="bg-gray-100 px-1 rounded text-sm">ZEBRA_API_KEY</code> del <code className="bg-gray-100 px-1 rounded text-sm">.env</code> con el que se compiló la app.
          </p>
          <p>
            La clave de aplicación de Zebra se obtiene en el{' '}
            <a href="https://developer.zebra.com/user/apps" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              portal para desarrolladores Zebra
            </a>
            . Lo guardado desde la interfaz en el navegador <strong>sustituye</strong> a esos valores por defecto.
          </p>
          <p>
            Opcionalmente puedes subir <strong>logo</strong> y <strong>favicon</strong>; se almacenan en el navegador como datos en base64 (evita ficheros muy grandes; por encima de unos <strong>400 KB</strong> por archivo puedes notar lentitud o límites de almacenamiento). <strong>Limpiar configuración guardada</strong> borra del navegador URL, clave, logo y favicon guardados; a partir de ahí vuelven a aplicarse los del <code className="bg-gray-100 px-1 rounded text-sm">.env</code> si existen.
          </p>
          <p className="text-sm text-gray-600">
            Si cambias <code className="bg-gray-100 px-1 rounded text-sm">ZEBRA_API_BASE_URL</code> o <code className="bg-gray-100 px-1 rounded text-sm">ZEBRA_API_KEY</code> en <code className="bg-gray-100 px-1 rounded text-sm">.env</code>, hay que <strong>volver a ejecutar</strong> <code className="bg-gray-100 px-1 rounded text-sm">npm run dev</code> o <code className="bg-gray-100 px-1 rounded text-sm">npm run build</code> para que el cliente reciba los nuevos valores por defecto.
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
            Un <strong>activo</strong> en este contexto es un identificador de negocio que quieres <strong>asociar a la tarea</strong> en Zebra Data Services (por
            ejemplo un pallet, un lote, un envío o un producto rastreado con <strong>GS1</strong>), no el sensor en sí (los sensores se asocian con <strong>Asociar sensor</strong>).
          </p>
          <p>
            En el formulario <strong>Añadir activo a la tarea</strong> introduces el <strong>identificador</strong> (típicamente una cadena en formato URI GS1
            digital link o el identificador que exija tu cadena de suministro) y el <strong>id_format</strong>. La app ofrece por defecto{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">ASSET_ID_FORMAT_GS1_URI</code>, alineado con la colección Postman oficial; otros formatos dependen
            de lo que publique la OpenAPI de tu entorno. La petición es un <code className="bg-gray-100 px-1 rounded text-sm">POST</code> a la API de gestión de
            sensores de temperatura.
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
              Un único archivo <code className="bg-gray-100 px-1 rounded text-sm">.env</code> en la raíz configura la web y el API (SQLite bajo <code className="bg-gray-100 px-1 rounded text-sm">/api</code>). El puerto es uno solo: <code className="bg-gray-100 px-1 rounded text-sm">PORT</code> (y <code className="bg-gray-100 px-1 rounded text-sm">HOST</code>).
            </li>
            <li>
              <strong>Desarrollo</strong>: <code className="bg-gray-100 px-1 rounded text-sm">npm run dev</code> ejecuta Express con Vite en modo middleware (hot reload). Instala dependencias una vez en la raíz con <code className="bg-gray-100 px-1 rounded text-sm">npm install</code> (incluye Express y SQLite).
            </li>
            <li>
              <strong>Producción local</strong>: <code className="bg-gray-100 px-1 rounded text-sm">npm start</code> compila y sirve <code className="bg-gray-100 px-1 rounded text-sm">dist/</code> desde el mismo proceso que el API.
            </li>
            <li>
              En servidor puedes usar PM2 con un solo proceso sobre <code className="bg-gray-100 px-1 rounded text-sm">npm start</code>.
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
};

export default Help;
