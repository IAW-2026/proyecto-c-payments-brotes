const SELLER_APP_URL = process.env.SELLER_APP_URL ?? "http://localhost:3002";
const SELLER_SERVICE_API_KEY = process.env.SELLER_SERVICE_API_KEY ?? "";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SELLER_SERVICE_API_KEY}`,
};

// POST /api/incoming-payouts
export async function notifyIncomingPayout(data: {
  payout_id: string;
  payment_id: string;
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

  if (!res.ok) throw new Error("Failed to notify incoming payout to Seller");
  return res.json();
}

// GET /api/sellers — filtra por id para obtener el email del seller
export async function getSellerEmail(sellerId: string | number) {
  /*if (process.env.NODE_ENV === "development") {
    return `seller+${sellerId}@example.com`;
    }*/

  const res = await fetch(`${SELLER_APP_URL}/api/sellers`, { headers });
  if (!res.ok) throw new Error("Failed to fetch sellers");

  const sellers: { id: number; email: string }[] = await res.json();
  const seller = sellers.find((s) => String(s.id) === String(sellerId));
  return seller?.email ?? null;
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
  if (!res.ok)
    throw new Error("Failed to notify stock reservation confirmed to Seller");

  const data = await res.json();
  console.log(
    "[sellerService][notifyStockReservationConfirmed] respuesta:",
    JSON.stringify(data),
  );
  return data;
}
