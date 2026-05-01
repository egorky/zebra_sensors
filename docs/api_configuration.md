# Configuración de la API y apariencia

Para usar la aplicación necesitas la URL base (`baseUrl`) y la clave de API (`apikey`) de Zebra Data Services. Puedes definirlos en la interfaz o en el archivo `.env`.

El login y los usuarios van contra el **mismo servidor** que sirve la SPA; las rutas del API están bajo **`/api`** (SQLite). Opcionalmente puedes fijar **`VITE_BACKEND_URL`** si el front y el API no comparten origen. Ver [backend_sqlite.md](backend_sqlite.md).

## Método 1: Interfaz web (recomendado para el día a día)

1. Inicia sesión y abre **Configuración** en el menú lateral.
2. Completa **Base URL** y **API Key** (clave de aplicación del [portal Zebra Developer](https://developer.zebra.com/user/apps)).
3. Opcional — **Apariencia:**
   - **Logo:** imagen mostrada junto al título en la barra lateral.
   - **Favicon:** icono de la pestaña del navegador.
   - Los archivos se convierten a datos en base64 y se guardan en el almacenamiento local del navegador (límite práctico recomendado: **400 KB** por archivo para evitar problemas de cuota).
4. Pulsa **Guardar configuración**.

La configuración guardada en el navegador **tiene prioridad** sobre los valores del `.env`.

### Limpiar configuración guardada

El botón **Limpiar configuración guardada** elimina del navegador la URL, la API key, el logo y el favicon guardados. Después se usarán de nuevo los valores por defecto del `.env` (si existen).

## Método 2: Archivo `.env`

1. Copia el ejemplo: `cp .env.example .env`
2. Ajusta al menos:

```dotenv
VITE_API_BASE_URL=https://api.zebra.com/v2
VITE_API_KEY=tu_api_key_aqui
# Opcional: solo si el front no está en el mismo host/puerto que el API.
# VITE_BACKEND_URL=
```

Un solo proceso usa **`HOST`** y **`PORT`** para la web y el API. Variables **`VITE_*`** se inyectan en el cliente en tiempo de compilación; si cambias `.env`, reinicia `npm run dev` o vuelve a ejecutar `npm run build`.

Variables del **servidor** en el **`.env` de la raíz**: `JWT_SECRET`, `DATABASE_PATH`, `BOOTSTRAP_*`, etc. Guía: [backend_sqlite.md](backend_sqlite.md).

## Referencia de APIs Zebra

Para ver cómo encajan estos ajustes con las APIs oficiales de sensores de temperatura, consulta [reference_zebra_apis.md](reference_zebra_apis.md). Sobre webhooks vs esta app (solo polling), véase [webhooks.md](webhooks.md).
