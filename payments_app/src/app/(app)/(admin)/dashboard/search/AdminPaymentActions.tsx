"use client";

import { useState } from "react";
import { updatePaymentStatus, deletePaymentAction } from "./actions";
import { useRouter } from "next/navigation";

interface AdminPaymentActionsProps {
  paymentId: number;
  status: string;
}

export function AdminPaymentActions({ paymentId, status }: AdminPaymentActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleStatusChange(newStatus: "approved" | "rejected") {
    if (!window.confirm(`¿Cambiar el estado del pago a "${newStatus === "approved" ? "Aprobado" : "Rechazado"}"?`)) return;
    setIsPending(true);
    const result = await updatePaymentStatus(paymentId, newStatus);
    setIsPending(false);
    if (!result.success) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este pago? Esta acción no se puede deshacer.")) return;
    setIsPending(true);
    const result = await deletePaymentAction(paymentId);
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
          <select
            value=""
            onChange={(e) => {
              if (e.target.value === "approved" || e.target.value === "rejected") {
                handleStatusChange(e.target.value);
              }
            }}
            disabled={isPending}
            className="text-xs rounded-lg border border-beige bg-white text-verde-profundo px-2 py-1 focus:outline-none focus:ring-2 focus:ring-verde-hoja flex-1"
          >
            <option value="" disabled>Cambiar estado</option>
            <option value="approved">Aprobar</option>
            <option value="rejected">Rechazar</option>
          </select>
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
