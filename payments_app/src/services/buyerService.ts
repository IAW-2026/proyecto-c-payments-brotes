const BUYER_APP_URL = process.env.BUYER_APP_URL ?? "http://localhost:3001";
const BUYER_APP_API_KEY = process.env.BUYER_APP_API_KEY ?? "";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${BUYER_APP_API_KEY}`,
};

// GET /api/orders/:id
export async function getOrder(orderId: string) {
  // MOCK para desarrollo
  if (process.env.NODE_ENV === "development") {
    return {
      id: orderId,
      buyer_id: "usr_456",
      seller_id: "usr_789",
      status: "confirmed",
      total: { amount: 15000, currency: "ARS" },
      payment_id: null,
      items: [
        {
          product_id: "prod_1",
          product_name: "Producto X",
          unit_price: 5000,
          quantity: 2,
          subtotal: 10000,
        },
      ],
      created_at: new Date().toISOString(),
    };
  }

  const res = await fetch(`${BUYER_APP_URL}/api/orders/${orderId}`, {
    headers,
  });

  if (!res.ok) throw new Error(`Failed to fetch order ${orderId}`);
  return res.json();
}

// POST /api/approved-payment
export async function notifyApprovedPayment(data: {
  payment_id: string;
  buyer_id: string;
  amount: { value: number; currency: string };
  created_at: string;
}) {
  // MOCK para desarrollo
  if (process.env.NODE_ENV === "development") {
    return {
      acknowledged: true,
      payment_id: data.payment_id,
      buyer_id: data.buyer_id,
    };
  }

  const res = await fetch(`${BUYER_APP_URL}/api/approved-payment`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to notify approved payment to Buyer");
  return res.json();
}

// POST /api/rejected-payment
export async function notifyRejectedPayment(data: {
  payment_id: string;
  buyer_id: string;
  amount: { value: number; currency: string };
  created_at: string;
}) {
  // MOCK para desarrollo
  if (process.env.NODE_ENV === "development") {
    return {
      acknowledged: true,
      payment_id: data.payment_id,
      buyer_id: data.buyer_id,
    };
  }

  const res = await fetch(`${BUYER_APP_URL}/api/rejected-payment`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to notify rejected payment to Buyer");
  return res.json();
}
