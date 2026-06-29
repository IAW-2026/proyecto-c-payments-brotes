import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PaymentIdSchema,
  UpdatePaymentStatusSchema,
} from "@/lib/validator";
import { notifyApprovedPayment, notifyRejectedPayment } from "@/services/buyerService";
import {
  notifyIncomingPayout,
  notifyStockReservationConfirmed,
  notifyStockReservationRejected,
  getSellerByInternalId,
} from "@/services/sellerService";

async function parseId(params: Promise<{ id: string }>) {
  const rawParams = await params;
  const result = PaymentIdSchema.safeParse(rawParams);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: "ID de pago inválido.",
          details: result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      ),
    };
  }
  return { id: result.data.id };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = await parseId(params);
    if ("error" in parsed) return parsed.error;

    const payment = await prisma.payment.findUnique({
      where: { id: parsed.id },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json({
      payment_id: payment.id,
      order_id: payment.order_id,
      buyer_id: payment.buyer_id,
      seller_id: payment.seller_id,
      status: payment.status,
      amount: { value: payment.amount, currency: payment.currency },
      created_at: payment.createdAt,
    });
  } catch (error) {
    console.log("[GET /api/payments/:id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = await parseId(params);
    if ("error" in parsed) return parsed.error;

    const body = await req.json();
    console.log("[PATCH /api/payments/:id] body recibido:", body);
    const bodyResult = UpdatePaymentStatusSchema.safeParse(body);
    if (!bodyResult.success) {
      return NextResponse.json(
        {
          error: "Estado inválido.",
          details: bodyResult.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { status: newStatus } = bodyResult.data;

    const existing = await prisma.payment.findUnique({
      where: { id: parsed.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Solo se pueden cambiar pagos en estado 'pending'." },
        { status: 400 },
      );
    }

    const updated = await prisma.payment.update({
      where: { id: parsed.id },
      data: { status: newStatus },
    });

    let resolvedSellerId = updated.seller_id;

    if (newStatus === "approved" && updated.seller_internal_id) {
      try {
        const seller = await getSellerByInternalId(updated.seller_internal_id);
        if (seller) {
          await prisma.payment.update({
            where: { id: updated.id },
            data: { seller_id: seller.clerk_id },
          });
          resolvedSellerId = seller.clerk_id;
          console.log("[PATCH /api/payments/:id] seller_id actualizado a clerkId:", seller.clerk_id);
        } else {
          console.error("[PATCH /api/payments/:id] No se pudo resolver clerkId para seller_internal_id:", updated.seller_internal_id);
        }
      } catch (e) {
        console.error("[PATCH /api/payments/:id] Error resolviendo clerkId:", e);
      }
    }

    let payout = null;

    if (newStatus === "approved") {
      payout = await prisma.payout.create({
        data: {
          payment_id: updated.id,
          seller_id: resolvedSellerId,
          seller_email: updated.seller_email ?? null,
          buyer_email: updated.buyer_email ?? null,
          amount: updated.amount,
          currency: updated.currency,
          status: "paid",
          seller_internal_id: updated.seller_internal_id,
        },
      });
    }

    // ── Notificaciones a Buyer y Seller Apps ──────────────────────────────────
    if (newStatus === "approved") {
      try {
        const buyerRes = await notifyApprovedPayment({
          payment_id: updated.id,
          buyer_id: updated.buyer_internal_id ?? updated.buyer_id,
          amount: { value: updated.amount, currency: updated.currency },
          created_at: updated.createdAt.toISOString(),
        });
        console.log("[PATCH /api/payments/:id] approved-payment acknowledged:", buyerRes);
      } catch (e) {
        console.error("[PATCH /api/payments/:id] Error notificando approved-payment:", e);
      }

      if (updated.order_id) {
        try {
          const stockConfirmRes = await notifyStockReservationConfirmed(updated.order_id);
          console.log("[PATCH /api/payments/:id] stock-reservation confirmed acknowledged:", stockConfirmRes);
        } catch (e) {
          console.error("[PATCH /api/payments/:id] Error notificando stock-reservation confirm:", e);
        }
      } else {
        console.warn("[PATCH /api/payments/:id] order_id es null, saltando notificación de stock");
      }

      if (payout) {
        try {
          const payoutRes = await notifyIncomingPayout({
            payout_id: payout.id,
            payment_id: payout.payment_id,
            seller_id: payout.seller_internal_id ?? payout.seller_id,
            amount: { value: payout.amount, currency: payout.currency },
            created_at: payout.createdAt.toISOString(),
          });
          console.log("[PATCH /api/payments/:id] incoming-payout acknowledged:", payoutRes);
        } catch (e) {
          console.error("[PATCH /api/payments/:id] Error notificando incoming-payout:", e);
        }
      }
    } else if (newStatus === "rejected") {
      console.log(
        "[PATCH /api/payments/:id] Rechazando payment:", parsed.id,
        "— notificando a Buyer y Seller",
      );
      try {
        const rejectedRes = await notifyRejectedPayment({
          payment_id: updated.id,
          buyer_id: updated.buyer_internal_id ?? updated.buyer_id,
          amount: { value: updated.amount, currency: updated.currency },
          created_at: updated.createdAt.toISOString(),
        });
        console.log("[PATCH /api/payments/:id] rejected-payment acknowledged:", rejectedRes);
      } catch (e) {
        console.error("[PATCH /api/payments/:id] Error notificando rejected-payment:", e);
      }

      if (updated.order_id) {
        try {
          const stockRejectRes = await notifyStockReservationRejected(updated.order_id);
          console.log("[PATCH /api/payments/:id] stock-reservation rejected acknowledged:", stockRejectRes);
        } catch (e) {
          console.error("[PATCH /api/payments/:id] Error notificando stock-reservation reject:", e);
        }
      } else {
        console.warn("[PATCH /api/payments/:id] order_id es null, saltando notificación de stock");
      }
    }

    return NextResponse.json({
      payment_id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("[PATCH /api/payments/:id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = await parseId(params);
    if ("error" in parsed) return parsed.error;

    const existing = await prisma.payment.findUnique({
      where: { id: parsed.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.payment.delete({ where: { id: parsed.id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/payments/:id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
