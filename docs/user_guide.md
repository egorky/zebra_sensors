# Guía de Usuario

Esta guía describe cómo utilizar las diferentes funcionalidades de la aplicación Zebra Sensor Manager.

## 1. Autenticación

### Página de Login
Al acceder a la aplicación, se te presentará una página de login.

-   **Campo "Username"**: Introduce el nombre de usuario configurado en el archivo `.env`.
-   **Campo "Password"**: Introduce la contraseña configurada en el archivo `.env`.
-   **Botón "Sign in"**: Haz clic para iniciar sesión. Si las credenciales son correctas, serás redirigido a la página de inicio. La sesión se mantendrá activa durante una hora.

### Cerrar Sesión
-   **Botón "Cerrar Sesión"**: Este botón se encuentra en la parte inferior del menú de navegación lateral. Haz clic en él para cerrar la sesión actual y volver a la página de login.

## 2. Página de Configuración

Esta página te permite gestionar la configuración de la API de Zebra.

-   **Campo "Base URL"**: Muestra la URL base de la API que se está utilizando. Puedes editarla para apuntar a un servidor diferente.
-   **Campo "API Key"**: Muestra la clave de API utilizada para la autenticación. Puedes cambiarla si tu clave ha sido actualizada.
-   **Botón "Guardar Configuración"**: Guarda los valores de "Base URL" y "API Key" en el almacenamiento local de tu navegador. Estos valores tendrán prioridad sobre los del archivo `.env`.
-   **Botón "Limpiar Configuración Guardada"**: Elimina la configuración guardada en el navegador. La próxima vez que recargues la página, la aplicación utilizará los valores del archivo `.env`.

## 3. Página de Sensores

Aquí puedes gestionar los sensores asociados a tu cuenta de Zebra.

-   **Botón "Refrescar"**: Vuelve a cargar la lista de sensores desde la API de Zebra. Úsalo para ver los cambios más recientes.
-   **Campo "Enrolar Nuevo Sensor"**: Introduce el número de serie de un nuevo sensor que desees registrar.
-   **Botón "Enrolar"**: Registra el sensor con el número de serie introducido. El nuevo sensor aparecerá en la lista.
-   **Botón "Desenrolar"**: Este botón aparece junto a cada sensor en la lista. Haz clic en él para eliminar el registro de ese sensor.

## 4. Página de Tareas

Esta página te permite gestionar las tareas de monitoreo de los sensores.

-   **Botón "Crear Tarea"**: Abre un formulario para crear una nueva tarea de monitoreo. Deberás rellenar detalles como el nombre de la tarea, los intervalos de lectura, los umbrales de temperatura, etc.

### Detalles de una Tarea
Al hacer clic en una tarea de la lista, se expandirá para mostrar más detalles y acciones.

-   **Desplegable "Asociar Sensor"**: Muestra una lista de los sensores disponibles que no están actualmente asignados a ninguna tarea. Selecciona un sensor de la lista.
-   **Botón "Asociar Sensor"**: Asocia el sensor seleccionado a la tarea.
-   **Botón "Detener Tarea"**: Detiene la tarea de monitoreo. La tarea dejará de recopilar datos.
-   **Botón "Extraer Datos"**: Solicita y muestra los datos de log recopilados por la tarea en formato JSON. Los datos aparecerán en un área de texto debajo de los detalles de la tarea.
