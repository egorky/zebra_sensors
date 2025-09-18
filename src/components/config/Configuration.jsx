import React, { useState, useEffect } from 'react';
import { saveConfig, getConfig } from '../../services/api';

const Configuration = () => {
  const [config, setConfig] = useState({ baseUrl: '', apikey: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadedConfig = getConfig();
    setConfig(loadedConfig);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({ ...prevConfig, [name]: value }));
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Configuración de API</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <p className="mb-6 text-gray-600">
          Aquí puedes configurar la URL base y la API key para conectarse a la API de Zebra.
          Estos valores se guardarán en el almacenamiento local de tu navegador.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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
          <div className="mb-6">
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
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Guardar Configuración
            </button>
            {message && <p className="text-green-500 text-xs italic">{message}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Configuration;
