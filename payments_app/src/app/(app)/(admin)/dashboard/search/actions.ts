"use server";

export async function updatePaymentStatus(
  paymentId: string,
  newStatus: "approved" | "rejected",
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/${paymentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SERVICE_API_KEY}`,
        },
        body: JSON.stringify({ status: newStatus }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error ?? "Error al actualizar el pago" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión con el servidor." };
  }
}

export async function deletePaymentAction(
  paymentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/${paymentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.SERVICE_API_KEY}`,
        },
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error ?? "Error al eliminar el pago" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión con el servidor." };
  }
}

export async function updatePayoutStatus(
  payoutId: string,
  newStatus: "paid",
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payouts/${payoutId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SERVICE_API_KEY}`,
        },
        body: JSON.stringify({ status: newStatus }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error ?? "Error al actualizar la acreditación" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión con el servidor." };
  }
}

export async function deletePayoutAction(
  payoutId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payouts/${payoutId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.SERVICE_API_KEY}`,
        },
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error ?? "Error al eliminar la acreditación" };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión con el servidor." };
  }
}
