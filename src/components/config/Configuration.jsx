import React, { useState, useEffect, useRef } from 'react';
import { saveConfig, getConfig, clearSavedConfig, trimTrailingSlash } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { readBackendAuthFromStorage, updateIntegrationSettings } from '../../services/backendApi';

const MAX_BRANDING_BYTES = 400 * 1024;

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const Configuration = () => {
  const { isAdmin } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!saveConfig(config)) {
      setMessage('Error al guardar la configuración.');
      return;
    }
    let msg = '¡Configuración guardada con éxito!';
    if (isAdmin && readBackendAuthFromStorage()?.token) {
      try {
        const base = trimTrailingSlash(config.baseUrl || '').trim();
        const key = String(config.apikey || '').trim();
        const body = {};
        if (base) body.zebra_base_url = base;
        if (key) body.zebra_api_key = key;
        if (Object.keys(body).length) {
          await updateIntegrationSettings(body);
          msg += ' Sincronizado con el servidor.';
        }
      } catch (err) {
        msg += ` No se pudo actualizar el servidor (poller): ${String(err.message || err)}`;
      }
    }
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleClearSaved = () => {
    if (
      !window.confirm(
        '¿Eliminar la configuración guardada en este navegador (URL, API key, logo y favicon)? Tras compilar o reiniciar el dev server se aplicarán de nuevo los valores por defecto desde ZEBRA_* del .env.'
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Configuración de API</h1>
      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md space-y-6 sm:space-y-8">
        <p className="text-gray-600 text-sm sm:text-base">
          Los valores por defecto de <strong>Base URL</strong> y <strong>API Key</strong> salen del archivo <code className="bg-gray-100 px-1 rounded text-sm">.env</code> en la raíz del
          proyecto (<code className="bg-gray-100 px-1 rounded text-sm">ZEBRA_API_BASE_URL</code>, <code className="bg-gray-100 px-1 rounded text-sm">ZEBRA_API_KEY</code>) y se inyectan al
          compilar el cliente. Los campos de abajo son <strong>opcionales</strong>: si los guardas, sustituyen esos valores solo en este navegador.
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
