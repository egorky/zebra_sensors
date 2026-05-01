# Webhooks y esta aplicación

## Qué dice la guía Zebra

En [Understanding Webhooks and APIs](https://docs.zebra.com/us/en/solutions/intelligent-sensors/zszb-dev-guide/using-webhook-subscriptions/understanding-webhooks-and-apis.html) se contrastan:

- **APIs (polling):** tu aplicación pregunta periódicamente o bajo demanda por datos.
- **Webhooks:** Zebra (u otro servicio) **envía** un POST a una URL que tú expongas cuando ocurre un evento.

Para cargas grandes o tiempo real, los webhooks suelen reducir latencia y número de peticiones repetidas.

## Qué hace Zebra Sensor Manager

Esta SPA solo usa **llamadas REST bajo demanda** (listados, detalle, log con cursor, alarmas paginadas). **No** registra webhooks ni expone un receptor HTTP: eso requiere un backend con URL pública, validación de firma según el producto, y configuración en el **Developer Portal** / servicios Zebra correspondientes.

## Si necesitas webhooks

1. Lee [Knowing When to Use Webhooks](https://docs.zebra.com/us/en/solutions/intelligent-sensors/zszb-dev-guide/using-webhook-subscriptions/understanding-webhooks-and-apis/knowing-when-to-use-webhooks.html) en la misma guía.
2. Implementa un endpoint HTTPS que reciba los POST y procese el cuerpo según la especificación del portal.
3. Configura la suscripción en el entorno Zebra (fuera de este repositorio).

La pantalla de inicio de la app incluye un resumen enlazando la documentación oficial.
