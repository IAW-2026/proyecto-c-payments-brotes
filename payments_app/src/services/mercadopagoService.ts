import MercadoPagoConfig, { Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function createPreference({
  paymentId,
  title,
  amount,
  currency,
  buyerEmail,
}: {
  paymentId: number;
  title: string;
  amount: number;
  currency: string;
  buyerEmail: string;
}) {
  const preference = new Preference(client);

  const response = await preference.create({
    body: {
      items: [
        {
          id: String(paymentId),
          title,
          quantity: 1,
          unit_price: amount,
          currency_id: currency,
        },
      ],
      payer: {
        email: buyerEmail,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payments/${paymentId}?status=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payments/${paymentId}?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/payments/${paymentId}?status=pending`,
      },
      //auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      external_reference: String(paymentId),
    },
  });

  return response;
}
