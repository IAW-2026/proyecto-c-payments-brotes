"use server";

export interface PaymentResult {
  payment_id: string;
  order_id: string;
  status: string;
  amount: { value: number; currency: string };
  created_at: string;
  mp_init_point?: string;
  error?: string;
}

export async function createPaymentAction(
  formData: FormData,
): Promise<PaymentResult> {
  const body = {
    order_id: formData.get("order_id"),
    buyer_id: formData.get("buyer_id"),
    seller_id: formData.get("seller_id"),
    amount: parseFloat(formData.get("amount") as string),
    currency: formData.get("currency") || "ARS",
    buyer_email: formData.get("buyer_email") || undefined,
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SERVICE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error ?? "Error al crear el pago" } as PaymentResult;
  }

  return data as PaymentResult;
}
