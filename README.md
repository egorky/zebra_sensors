# Zebra Sensor Manager

Este proyecto es una interfaz web diseñada para facilitar la gestión de sensores de la marca Zebra a través de su API. Permite a los usuarios, incluso sin experiencia técnica, configurar la conexión a la API, gestionar sensores (enrolar/desenrolar) y administrar tareas de monitoreo.

## Características

- **Configuración Dinámica:** Define y actualiza la `baseUrl` y la `apikey` de la API directamente desde la interfaz web. La configuración se guarda localmente en el navegador para persistir entre sesiones.
- **Gestión de Sensores:**
  - Lista todos los sensores asociados a tu tenant.
  - Enrola nuevos sensores utilizando su número de serie.
  - Desenrola sensores existentes.
- **Gestión de Tareas:**
  - Lista todas las tareas de monitoreo.
  - Crea nuevas tareas con parámetros detallados como intervalos, umbrales de temperatura y más.
  - Asocia sensores disponibles a una tarea.
  - Detiene tareas activas.
  - Extrae y visualiza los datos de log de una tarea en formato JSON.

## Requisitos Previos

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior) y un gestor de paquetes como `npm` o `yarn`.

## Instalación

1.  Clona este repositorio en tu máquina local.
2.  Navega al directorio del proyecto:
    ```bash
    cd zebra-sensor-manager
    ```
3.  Instala las dependencias del proyecto:
    ```bash
    npm install
    ```
    o si usas `yarn`:
    ```bash
    yarn install
    ```

## Configuración

La aplicación se puede configurar de dos maneras:

### 1. Archivo `.env` (Configuración Inicial)

Puedes proporcionar valores por defecto para la `baseUrl`, la `apikey` y el puerto de desarrollo creando un archivo `.env` en la raíz del proyecto.

1.  Crea una copia del archivo de ejemplo:
    ```bash
    cp .env.example .env
    ```
2.  Edita el archivo `.env` con tus credenciales y configuración deseada:
    ```
    # Puerto para el servidor de desarrollo (por defecto: 5173)
    PORT=5173

    # Credenciales de la API
    VITE_API_BASE_URL=https://api.zebra.com/v2
    VITE_API_KEY=tu_api_key_aqui
    ```

### 2. Interfaz Web (Recomendado para el uso diario)

La forma más sencilla de configurar la aplicación es a través de la propia interfaz web.

1.  Ve a la sección **Configuración** en el menú lateral.
2.  Introduce tu **Base URL** y **API Key**.
3.  Haz clic en **Guardar Configuración**.

Estos valores se guardarán en el almacenamiento local de tu navegador y tendrán prioridad sobre los valores del archivo `.env`.

## Ejecución de la Aplicación

Para iniciar el servidor de desarrollo, ejecuta:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173` (o el puerto que se indique en la consola).

## Cómo Usar la Aplicación

### Gestión de Sensores

1.  Navega a la sección **Sensores**.
2.  **Para ver los sensores:** La lista de sensores enrolados se carga automáticamente. Puedes hacer clic en **Refrescar** para obtener la lista más reciente.
3.  **Para enrolar un sensor:** Introduce el número de serie en el campo "Enrolar Nuevo Sensor" y haz clic en **Enrolar**.
4.  **Para desenrolar un sensor:** Encuentra el sensor en la lista y haz clic en el botón **Desenrolar**.

### Gestión de Tareas

1.  Navega a la sección **Tareas**.
2.  **Para crear una tarea:**
    - Haz clic en **Crear Tarea**.
    - Rellena el formulario con los detalles de la tarea (nombre, intervalos, umbrales, etc.).
    - Haz clic en **Crear Tarea** dentro del modal.
3.  **Para ver los detalles de una tarea:** Haz clic en una tarea de la lista. Se desplegará una sección con los detalles y acciones disponibles.
4.  **Para asociar un sensor a una tarea:**
    - Despliega los detalles de la tarea.
    - Selecciona un sensor disponible en el menú desplegable.
    - Haz clic en **Asociar Sensor**.
5.  **Para detener una tarea:** Haz clic en el botón **Detener Tarea** en los detalles de la tarea.
6.  **Para extraer datos de una tarea:** Haz clic en **Extraer Datos**. Los datos del log se mostrarán en formato JSON en la parte inferior de los detalles de la tarea.
