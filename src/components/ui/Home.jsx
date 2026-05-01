import React, { useState } from 'react';

const WEBHOOK_GUIDE =
  'https://docs.zebra.com/us/en/solutions/intelligent-sensors/zszb-dev-guide/using-webhook-subscriptions/understanding-webhooks-and-apis.html';

const Home = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Bienvenido al Gestor de Sensores Zebra</h1>
        <p className="text-lg text-gray-700">
          Utilice el menú de la izquierda para configurar la API, gestionar sensores y tareas, y consultar logs paginados.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full text-left px-5 py-4 font-semibold text-gray-900 flex justify-between items-center hover:bg-gray-50"
        >
          Webhooks frente a consultar la API (polling)
          <span className="text-gray-500 text-sm">{open ? 'Ocultar' : 'Mostrar'}</span>
        </button>
        {open && (
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 text-gray-700 text-sm space-y-3 leading-relaxed">
            <p>
              Esta aplicación obtiene datos <strong>cuando pulsas los botones</strong> (polling sobre las APIs REST). La guía de Zebra explica que los{' '}
              <strong>webhooks</strong> permiten que la plataforma te envíe eventos a un endpoint HTTPS tuyo cuando ocurre algo, lo que suele ser más eficiente
              que pedir el mismo histórico una y otra vez.
            </p>
            <p>
              La suscripción y configuración de webhooks se gestiona en el ecosistema Zebra Data Services / portal de desarrolladores (no en esta SPA). Para
              decidir cuándo conviene cada modelo, lee la sección oficial:{' '}
              <a href={WEBHOOK_GUIDE} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                Understanding Webhooks and APIs
              </a>
              . Documentación local: <code className="bg-gray-100 px-1 rounded">docs/webhooks.md</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
