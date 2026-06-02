# Brotes: Payments & Payouts

## Deploy de producción

[URL del deploy]([#](https://proyecto-c-payments-brotes.vercel.app/))

---

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Buyer | buyerpayment+clerk_test@iaw.com | iawuser# |
| Buyer | buyer+clerk_test@iaw.com | " |
| Seller | seller+clerk_test@iaw.com | " |
| Seller | seller2+clerk_test@iaw.com | " |
| Seller | seller3+clerk_test@iaw.com | " |
| Seller | sseller4+clerktest@iaw.com | " |
| Seller | sellerpayment+clerck_test@iaw.com | " |
| **Admin**| admin+clerk_test@iaw.com | " |

---

## Instrucciones para evaluar la aplicación

1. Loguearse con un usuario **buyer** para iniciar el flujo de pago
  + ir al apartado de test para producir un pago en pendiente
2. Loguearse con un usuario **seller** para ver los pagos recibidos y el estado de acreditación
3. Para probar un pago aprobado, usar las [tarjetas de prueba de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards)
4. Los pagos en estado `pending` expiran automáticamente a los 5 minutos si la página de detalle permanece abierta — esto es configurable (se decidió 5 minutos para pruebas)
 +  Datos de mercadopago:
   + usuario: TESTUSER1463505031370575893
   + contraseña: JsNG7zRMeo
   + Código de verificación: 108263
   + Dinero inicial en cuenta: 50000 
---

## Descripción del proyecto

Brotes es una plataforma de marketplace para la compra y venta de plantas y productos de jardinería. Este repositorio corresponde al dominio de **Payments & Payouts**: gestiona el ciclo de vida de los pagos entre compradores y vendedores, desde la creación del pago hasta la acreditación al seller.

La aplicación se integra con **MercadoPago** como gateway de pagos y coordina con las apps de Buyer y Seller mediante notificaciones HTTP para mantener el estado del sistema sincronizado: confirmación de stock, notificación de orden aprobada o rechazada, y acreditación del pago al vendedor.

Los pagos aprobados generan automáticamente un **Payout** para el seller. El estado de los payouts se actualiza en tiempo real en la UI sin necesidad de recargar la página, utilizando Server-Sent Events sobre Server Components de Next.js.

---


### Decisiones de diseño

- **Separación de formatos de webhook**: MercadoPago envía dos requests por evento — uno en formato legacy y uno en formato nuevo . El handler procesa ambos: el legacy sin verificación de firma, el nuevo con verificación HMAC-SHA256.
- **Payout creado como `paid`**: los payouts se crean en `paid` ya que el simular la verificación de la acreditación no fue posible debido a que se debe de usar apis externas para simular delays (llm sugería vercel cron o inngenst)
- **Actualización en tiempo real**: se usa Server-Sent Events sobre Next.js App Router para actualizar el estado del pago en la UI sin polling desde el cliente ni recarga de página. El SSE hace polling a Prisma cada 3 segundos y cierra la conexión al llegar a un estado terminal (`approved` o `rejected`).
- **Expiración de pagos**: los payments en `pending` por más de 5 minutos (configurable, pensado para ser 60 minutos en producción) se rechazan automáticamente desde el endpoint SSE cuando la página de detalle está abierta.

### Limitaciones conocidas

- **Expiración solo con página abierta**: la lógica de expiración de pagos corre dentro del SSE, por lo que solo se ejecuta mientras el usuario tenga abierta la página de detalle del pago. Si el usuario abandona el flujo sin completar el pago y nunca vuelve a la página, el payment queda en `pending` indefinidamente. Una solución completa requeriría algo como un cron job.
- **Notificaciones a Buyer App y Seller App**: las notificaciones hacia las otras apps del sistema (`notifyApprovedPayment`, `notifyRejectedPayment`, `notifyStockReservationConfirmed`, etc.) están implementadas con mocks en desarrollo. En producción requieren que `BUYER_APP_URL` y `SELLER_APP_URL` estén configuradas y que esas apps estén desplegadas. Por el momento funciona sin afectar el flujo pero devuelven errores por no estar conectadas.
- **Timeout en Vercel**: el uso de `setTimeout` para delays no es confiable en entornos serverless como Vercel, donde los procesos pueden apagarse entre requests. Esto puede mejorarse usando una api externa como se mencionó previamente.
- **Un payout por payment**: el modelo actual asume una relación 1 a 1 entre Payment y Payout. Casos de pagos parciales o múltiples acreditaciones no están contemplados. Las disputas no están contempladas de manera explícita pero se tuvo en cuenta al permitir al admin modificar estados de ambos.
