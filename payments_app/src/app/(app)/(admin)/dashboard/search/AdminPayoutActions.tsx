"use client";

import { useState } from "react";
import { updatePayoutStatus, deletePayoutAction } from "./actions";
import { useRouter } from "next/navigation";

interface AdminPayoutActionsProps {
  payoutId: string;
  status: string;
}

export function AdminPayoutActions({ payoutId, status }: AdminPayoutActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleMarkPaid() {
    if (!window.confirm("¿Marcar esta acreditación como pagada?")) return;
    setIsPending(true);
    const result = await updatePayoutStatus(payoutId, "paid");
    setIsPending(false);
    if (!result.success) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar esta acreditación? Esta acción no se puede deshacer.")) return;
    setIsPending(true);
    const result = await deletePayoutAction(payoutId);
    setIsPending(false);
    if (!result.success) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2 w-full">
      {status === "pending" && (
        <div className="flex items-center gap-1.5 w-full">
          <button
            onClick={handleMarkPaid}
            disabled={isPending}
            className="text-xs px-3 py-1 rounded-lg bg-verde-bosque text-white hover:bg-verde-profundo transition-colors disabled:opacity-50"
          >
            Marcar como acreditada
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-terracota hover:text-terracota-oscuro px-2 py-1 rounded-lg hover:bg-arena transition-colors"
          >
            Eliminar
          </button>
        </div>
      )}
      {status !== "pending" && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-terracota hover:text-terracota-oscuro px-2 py-1 rounded-lg hover:bg-arena transition-colors ml-auto"
        >
          Eliminar
        </button>
      )}
    </div>
  );
}
