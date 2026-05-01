# Configuración de la API

Para que la aplicación funcione correctamente, es necesario configurar la URL base (`baseUrl`) y la clave de API (`apiKey`) para la API de Zebra. Hay dos maneras de configurar estos valores: a través de la interfaz web o mediante un archivo de entorno `.env`.

## Método 1: Configuración a través de la Interfaz Web (Recomendado)

Este es el método más sencillo y recomendado para el uso diario.

1.  **Navega a la página de Configuración:** En el menú lateral de la aplicación, haz clic en **Configuración**.

2.  **Introduce tus credenciales:**
    *   En el campo **Base URL**, introduce la URL base de la API de Zebra. Por ejemplo: `https://api.zebra.com/v2`.
    *   En el campo **API Key**, introduce tu clave de API personal.

3.  **Guarda la configuración:** Haz clic en el botón **Guardar Configuración**.

Los valores se guardarán en el almacenamiento local de tu navegador y se utilizarán para todas las solicitudes a la API. Esta configuración persistirá incluso si cierras y vuelves a abrir el navegador.

## Método 2: Configuración mediante un archivo `.env`

Este método es útil para establecer valores por defecto, especialmente en un entorno de desarrollo.

1.  **Crea un archivo `.env`:** En la raíz del proyecto, crea un archivo llamado `.env`. Puedes hacerlo copiando el archivo de ejemplo `.env.example`:
    ```bash
    cp .env.example .env
    ```

2.  **Edita el archivo `.env`:** Abre el archivo `.env` y modifica las siguientes variables:
    ```dotenv
    # --- Configuración de la API de Zebra ---
    # URL base para la API de Zebra
    VITE_API_BASE_URL=https_tu_url_base_aqui

    # API Key para la API de Zebra
    VITE_API_KEY=tu_api_key_aqui
    ```
    Reemplaza `https_tu_url_base_aqui` y `tu_api_key_aqui` con tus valores reales.

**Importante:** Los valores configurados a través de la interfaz web siempre tendrán prioridad sobre los valores definidos in el archivo `.env`. Si has guardado una configuración en la interfaz, esa será la que se use. Para volver a usar los valores del archivo `.env`, puedes borrar la configuración guardada en el navegador desde la propia página de configuración.
