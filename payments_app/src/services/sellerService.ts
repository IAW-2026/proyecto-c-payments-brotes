const SELLER_APP_URL = (process.env.SELLER_APP_URL ?? "http://localhost:3002").replace(/\/+$/, "");
const SELLER_SERVICE_API_KEY = process.env.SELLER_SERVICE_API_KEY ?? "";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SELLER_SERVICE_API_KEY}`,
};

// POST /api/incoming-payouts
export async function notifyIncomingPayout(data: {
  payout_id: number;
  payment_id: number;
  seller_id: string | number;
  amount: { value: number; currency: string };
  created_at: string;
}) {
  // MOCK para desarrollo
  if (process.env.NODE_ENV === "development") {
    return {
      acknowledged: true,
      payout_id: data.payout_id,
      seller_id: data.seller_id,
    };
  }

  const res = await fetch(`${SELLER_APP_URL}/api/incoming-payouts`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  console.log("[sellerService][notifyIncomingPayout] status:", res.status);
  if (!res.ok) {
    console.warn("[sellerService][notifyIncomingPayout] responded with", res.status, "- continuando sin notificar");
    return { acknowledged: false, status: res.status };
  }
  return res.json();
}

// GET /api/sellers/:id — obtiene perfil del vendedor (nombre)
export async function getSellerName(sellerId: number): Promise<string | null> {
  console.log("[sellerService][getSellerName] sellerId:", sellerId);

  if (process.env.NODE_ENV === "development") {
    console.log("[sellerService][getSellerName] modo development, devolviendo mock");
    return `Vendedor ${sellerId}`;
  }

  const url = `${SELLER_APP_URL}/api/sellers/${sellerId}`;
  console.log("[sellerService][getSellerName] GET", url);

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn("[sellerService][getSellerName] status:", res.status);
      return null;
    }
    const data = await res.json();
    const name = data?.name ?? data?.nombre ?? data?.email ?? null;
    console.log("[sellerService][getSellerName] nombre obtenido:", name);
    return name;
  } catch (err) {
    console.error("[sellerService][getSellerName] error:", err);
    return null;
  }
}

// GET /api/sellers — filtra por id para obtener el email del seller
export async function getSellerEmail(sellerId: string | number) {
  console.log("[sellerService][getSellerEmail] sellerId:", sellerId);

  /*if (process.env.NODE_ENV === "development") {
    console.log(
      "[sellerService][getSellerEmail] modo development, devolviendo mock",
    );
    return `seller+${sellerId}@example.com`;
  }*/

  const url = `${SELLER_APP_URL}/api/sellers`;

  console.log("[sellerService][getSellerEmail] GET", url);

  const res = await fetch(url, { headers });

  console.log("[sellerService][getSellerEmail] status:", res.status);

  if (!res.ok) {
    console.error("[sellerService][getSellerEmail] error al obtener sellers");
    throw new Error("Failed to fetch sellers");
  }
  //tratando de obtener el mail
  const { sellers }: { sellers: { id: number; email: string }[] } =
    await res.json();

  console.log(
    "[sellerService][getSellerEmail] sellers recibidos:",
    sellers.length,
  );

  const seller = sellers.find((s) => String(s.id) === String(sellerId));

  console.log(
    "[sellerService][getSellerEmail] seller encontrado:",
    seller ? JSON.stringify(seller) : "null",
  );

  const email = seller?.email ?? null;

  console.log("[sellerService][getSellerEmail] email retornado:", email);

  return email;
}

// GET /api/sellers/:seller_id/products/:id
export async function getSellerProduct(
  sellerId: number,
  productId: number,
): Promise<{ name: string } | null> {
  console.log(
    "[sellerService][getSellerProduct] sellerId:",
    sellerId,
    "productId:",
    productId,
  );

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[sellerService][getSellerProduct] modo development, devolviendo mock",
    );
    return { name: `Producto ${productId}` };
  }

  const url = `${SELLER_APP_URL}/api/sellers/${sellerId}/products/${productId}`;
  console.log("[sellerService][getSellerProduct] GET", url);

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn("[sellerService][getSellerProduct] status:", res.status);
      return null;
    }
    const data = await res.json();
    return { name: data.name };
  } catch (err) {
    console.error("[sellerService][getSellerProduct] error:", err);
    return null;
  }
}

// POST /api/stock-reservations/:orderId/confirm
export async function notifyStockReservationConfirmed(
  buyerOrderId?: string | number,
) {
  console.log(
    "[sellerService][notifyStockReservationConfirmed] orderId:-- | buyerOrderId:",
    buyerOrderId,
  );

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[sellerService][notifyStockReservationConfirmed] modo development, devolviendo mock",
    );
    return { acknowledged: true, buyer_order_id: buyerOrderId };
  }

  const url = `${SELLER_APP_URL}/api/stock-reservations/${buyerOrderId}/confirm`;
  const payload = {
    buyer_order_id: buyerOrderId ? String(buyerOrderId) : undefined,
    confirmed_at: new Date().toISOString(),
  };

  console.log("[sellerService][notifyStockReservationConfirmed] POST", url);
  console.log(
    "[sellerService][notifyStockReservationConfirmed] payload:",
    JSON.stringify(payload),
  );

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  console.log(
    "[sellerService][notifyStockReservationConfirmed] status:",
    res.status,
  );
  if (!res.ok) {
    console.warn("[sellerService][notifyStockReservationConfirmed] responded with", res.status, "- continuando sin notificar");
    return { acknowledged: false, status: res.status };
  }

  const data = await res.json();
  console.log(
    "[sellerService][notifyStockReservationConfirmed] respuesta:",
    JSON.stringify(data),
  );
  return data;
}
//por qué buyerOrderId es opcional??
export async function notifyStockReservationRejected(
  buyerOrderId?: string | number,
) {
  console.log(
    "[sellerService][notifyStockReservationRejected] orderId:",
    buyerOrderId,
  );

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[sellerService][notifyStockReservationRejected] modo development, devolviendo mock",
    );
    return { acknowledged: true, order_id: buyerOrderId };
  }

  const url = `${SELLER_APP_URL}/api/stock-reservations/${buyerOrderId}/reject`;

  const payload = {
    buyer_order_id: buyerOrderId ? String(buyerOrderId) : undefined,
    rejected_at: new Date().toISOString(),
  };

  console.log("[sellerService][notifyStockReservationRejected] POST", url);
  console.log("[sellerService][notifyStockReservationRejected] payload:", JSON.stringify(payload));

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  console.log(
    "[sellerService][notifyStockReservationRejected] status:",
    res.status,
  );

  if (!res.ok) {
    console.warn("[sellerService][notifyStockReservationRejected] responded with", res.status, "- continuando sin notificar");
    return { acknowledged: false, status: res.status };
  }

  const data = await res.json();

  console.log(
    "[sellerService][notifyStockReservationRejected] respuesta:",
    JSON.stringify(data),
  );

  return data;
}
