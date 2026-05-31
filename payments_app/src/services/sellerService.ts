const SELLER_APP_URL = process.env.SELLER_APP_URL ?? "http://localhost:3002";
const SELLER_APP_API_KEY = process.env.SELLER_APP_API_KEY ?? "";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SELLER_APP_API_KEY}`,
};

// POST /api/incoming-payouts
export async function notifyIncomingPayout(data: {
  payout_id: string;
  payment_id: string;
  seller_id: string;
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
