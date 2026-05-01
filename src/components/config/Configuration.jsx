import React, { useState, useEffect, useRef } from 'react';
import { saveConfig, getConfig, clearSavedConfig } from '../../services/api';

const MAX_BRANDING_BYTES = 400 * 1024;

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const Configuration = () => {
  const [config, setConfig] = useState({
    baseUrl: '',
    apikey: '',
    logoDataUrl: '',
    faviconDataUrl: '',
  });
  const [message, setMessage] = useState('');
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }));
  };

  const handleBrandingFile = async (field, file) => {
    if (!file) return;
    if (file.size > MAX_BRANDING_BYTES) {
      setMessage('El archivo es demasiado grande (máximo 400 KB).');
      setTimeout(() => setMessage(''), 4000);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setConfig((prev) => ({ ...prev, [field]: dataUrl }));
      setMessage('');
    } catch {
      setMessage('No se pudo leer el archivo.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saveConfig(config)) {
      setMessage('¡Configuración guardada con éxito!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Error al guardar la configuración.');
    }
  };

  const handleClearSaved = () => {
    if (
      !window.confirm(
        '¿Eliminar la configuración guardada en este navegador (URL, API key, logo y favicon)? Se usarán los valores del archivo .env si existen.'
      )
    ) {
      return;
    }
    if (clearSavedConfig()) {
      setConfig(getConfig());
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (faviconInputRef.current) faviconInputRef.current.value = '';
      setMessage('Configuración local eliminada.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Configuración de API</h1>
      <div className="bg-white p-8 rounded-lg shadow-md space-y-8">
        <p className="text-gray-600">
          La <strong>Base URL</strong> y la <strong>API Key</strong> pueden definirse en el archivo <code className="bg-gray-100 px-1 rounded">.env</code> del
          proyecto (<code className="bg-gray-100 px-1 rounded">VITE_API_BASE_URL</code>, <code className="bg-gray-100 px-1 rounded">VITE_API_KEY</code>) como
          valores por defecto. Los campos de abajo son <strong>opcionales</strong>: si los guardas, sustituyen a los del <code className="bg-gray-100 px-1 rounded">.env</code> solo en este navegador (útil para pruebas o varios entornos).
        </p>
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          La guía de Zebra indica que la autenticación solo con cabecera <code className="bg-amber-100 px-1 rounded">apikey</code> es adecuada sobre todo para pruebas y PoC; en producción suele valorarse OAuth u otros flujos descritos en su documentación.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="baseUrl" className="block text-gray-700 font-bold mb-2">
              Base URL
            </label>
            <input
              type="text"
              id="baseUrl"
              name="baseUrl"
              value={config.baseUrl}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="https://api.zebra.com/v2"
            />
          </div>
          <div>
            <label htmlFor="apikey" className="block text-gray-700 font-bold mb-2">
              API Key
            </label>
            <input
              type="password"
              id="apikey"
              name="apikey"
              value={config.apikey}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Tu API Key"
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Apariencia (opcional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Carga un logo y un favicon desde archivos locales (PNG, JPG, SVG, ICO). Se guardan en este navegador; recomendado máximo 400 KB por archivo.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <span className="block text-gray-700 font-bold mb-2">Logo (barra lateral)</span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-600"
                  onChange={(e) => handleBrandingFile('logoDataUrl', e.target.files?.[0])}
                />
                {config.logoDataUrl ? (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={config.logoDataUrl}
                      alt="Vista previa del logo"
                      className="max-h-14 max-w-[180px] object-contain border rounded p-1 bg-gray-50"
                    />
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => {
                        setConfig((p) => ({ ...p, logoDataUrl: '' }));
                        if (logoInputRef.current) logoInputRef.current.value = '';
                      }}
                    >
                      Quitar logo
                    </button>
                  </div>
                ) : null}
              </div>
              <div>
                <span className="block text-gray-700 font-bold mb-2">Favicon (pestaña del navegador)</span>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*,.ico"
                  className="block w-full text-sm text-gray-600"
                  onChange={(e) => handleBrandingFile('faviconDataUrl', e.target.files?.[0])}
                />
                {config.faviconDataUrl ? (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={config.faviconDataUrl}
                      alt="Vista previa del favicon"
                      className="h-8 w-8 object-contain border rounded p-0.5 bg-gray-50"
                    />
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={() => {
                        setConfig((p) => ({ ...p, faviconDataUrl: '' }));
                        if (faviconInputRef.current) faviconInputRef.current.value = '';
                      }}
                    >
                      Quitar favicon
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-between border-t border-gray-200 pt-6">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Guardar configuración
            </button>
            <button
              type="button"
              onClick={handleClearSaved}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
            >
              Limpiar configuración guardada
            </button>
            {message ? <p className="text-sm text-green-600 w-full md:w-auto">{message}</p> : null}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuration;
