const BUYER_APP_URL = (process.env.BUYER_APP_URL ?? "http://localhost:3001").replace(/\/+$/, "");
const BUYER_SERVICE_API_KEY = process.env.BUYER_SERVICE_API_KEY ?? "";
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${BUYER_SERVICE_API_KEY}`,
};

// GET /api/buyers/:id — obtiene perfil del comprador (nombre)
export async function getBuyerName(buyerId: number): Promise<string | null> {
  console.log("[buyerService][getBuyerName] buyerId:", buyerId);

  if (process.env.NODE_ENV === "development") {
    console.log("[buyerService][getBuyerName] modo development, devolviendo mock");
    return `Comprador ${buyerId}`;
  }

  const url = `${BUYER_APP_URL}/api/buyers/${buyerId}`;
  console.log("[buyerService][getBuyerName] GET", url);

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn("[buyerService][getBuyerName] status:", res.status);
      return null;
    }
    const data = await res.json();
    const name = data?.name ?? data?.nombre ?? data?.email ?? null;
    console.log("[buyerService][getBuyerName] nombre obtenido:", name);
    return name;
  } catch (err) {
    console.error("[buyerService][getBuyerName] error:", err);
    return null;
  }
}

// GET /api/orders/:id
export async function getOrder(orderId: string) {
  console.log("[buyerService][getOrder] orderId:", orderId);

  if (process.env.NODE_ENV === "development") {
    console.log("[buyerService][getOrder] modo development, devolviendo mock");
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

  const url = `${BUYER_APP_URL}/api/orders/${orderId}`;
  console.log("[buyerService][getOrder] GET", url);

  const res = await fetch(url, { headers });

  console.log("[buyerService][getOrder] status:", res.status);
  if (!res.ok) throw new Error(`Failed to fetch order ${orderId}`);

  const data = await res.json();
  console.log("[buyerService][getOrder] respuesta:", JSON.stringify(data));
  return data;
}

// POST /api/approved-payment
export async function notifyApprovedPayment(data: {
  payment_id: string;
  buyer_id: string | number;
  amount: { value: number; currency: string };
  created_at: string;
}) {
  console.log(
    "[buyerService][notifyApprovedPayment] payload:",
    JSON.stringify(data),
  );

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[buyerService][notifyApprovedPayment] modo development, devolviendo mock",
    );
    return {
      acknowledged: true,
      payment_id: data.payment_id,
      buyer_id: data.buyer_id,
    };
  }

  const url = `${BUYER_APP_URL}/api/approved-payment/${data.payment_id}`;
  console.log("[buyerService][notifyApprovedPayment] POST", url);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  console.log("[buyerService][notifyApprovedPayment] status:", res.status);
  if (!res.ok) {
    console.warn("[buyerService][notifyApprovedPayment] responded with", res.status, "- continuando sin notificar");
    return { acknowledged: false, status: res.status };
  }

  const responseData = await res.json();
  console.log(
    "[buyerService][notifyApprovedPayment] respuesta:",
    JSON.stringify(responseData),
  );
  return responseData;
}

// POST /api/rejected-payment
export async function notifyRejectedPayment(data: {
  payment_id: string;
  buyer_id: string | number;
  amount: { value: number; currency: string };
  created_at: string;
}) {
  console.log(
    "[buyerService][notifyRejectedPayment] payload:",
    JSON.stringify(data),
  );

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[buyerService][notifyRejectedPayment] modo development, devolviendo mock",
    );
    return {
      acknowledged: true,
      payment_id: data.payment_id,
      buyer_id: data.buyer_id,
    };
  }

  const url = `${BUYER_APP_URL}/api/rejected-payment/${data.payment_id}`;
  console.log("[buyerService][notifyRejectedPayment] POST", url);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  console.log("[buyerService][notifyRejectedPayment] status:", res.status);
  if (!res.ok) {
    console.warn("[buyerService][notifyRejectedPayment] responded with", res.status, "- continuando sin notificar");
    return { acknowledged: false, status: res.status };
  }

  const responseData = await res.json();
  console.log(
    "[buyerService][notifyRejectedPayment] respuesta:",
    JSON.stringify(responseData),
  );
  return responseData;
}
