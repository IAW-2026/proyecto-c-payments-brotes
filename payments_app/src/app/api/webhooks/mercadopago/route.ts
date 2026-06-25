import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { createHmac } from "crypto";
import {
  notifyApprovedPayment,
  notifyRejectedPayment,
} from "@/services/buyerService";
import {
  notifyIncomingPayout,
  notifyStockReservationConfirmed,
  notifyStockReservationRejected,
} from "@/services/sellerService";

function verifyMPSignature(req: NextRequest): boolean {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  const urlParams = new URL(req.url).searchParams;
  // El formato nuevo manda ?data.id=..., el legacy manda ?id=...
  const dataId = urlParams.get("data.id") ?? urlParams.get("id");

  if (!xSignature) return false;

  // Usar indexOf para no cortar si el valor tiene "=" internamente
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const idx = p.indexOf("=");
      return [p.slice(0, idx).trim(), p.slice(idx + 1).trim()];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // El manifest debe terminar con ";" según la doc de MP:
  // template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
  const manifest =
    [
      dataId ? `id:${dataId}` : null,
      xRequestId ? `request-id:${xRequestId}` : null,
      `ts:${ts}`,
    ]
      .filter(Boolean)
      .join(";") + ";";

  const secret = process.env.MP_WEBHOOK_SECRET!;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  console.log("[MP Webhook] diagnóstico de firma:", {
    dataId,
    xRequestId,
    ts,
    manifest,
    expected,
    receivedV1: v1,
    match: expected === v1,
  });

  return expected === v1;
}

async function firePaymentNotifications(
  newStatus: string,
  payment: {
    id: number;
    order_id: string;
    buyer_id: string;
    buyer_internal_id: number | null;
    amount: number;
    currency: string;
    createdAt: Date;
  },
  payout?: {
    id: number;
    payment_id: number;
    seller_id: string;
    seller_internal_id: number | null;
    amount: number;
    currency: string;
    createdAt: Date;
  } | null,
) {
  if (newStatus === "approved") {
    try {
      const buyerRes = await notifyApprovedPayment({
        payment_id: payment.id,
        buyer_id: payment.buyer_internal_id ?? payment.buyer_id,
        amount: { value: payment.amount, currency: payment.currency },
        created_at: payment.createdAt.toISOString(),
      });
      console.log("[MP Webhook] approved-payment acknowledged:", buyerRes);
    } catch (e) {
      console.error("[MP Webhook] Error notificando approved-payment:", e);
    }

    if (payment.order_id) {
      try {
        const stockConfirmRes = await notifyStockReservationConfirmed(
          payment.order_id,
        );
        console.log(
          "[MP Webhook] stock-reservation confirmed acknowledged:",
          stockConfirmRes,
        );
      } catch (e) {
        console.error(
          "[MP Webhook] Error notificando stock-reservation confirm:",
          e,
        );
      }
    } else {
      console.warn(
        "[MP Webhook] order_id es null, saltando notificación de stock",
      );
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
        console.log("[MP Webhook] incoming-payout acknowledged:", payoutRes);
      } catch (e) {
        console.error("[MP Webhook] Error notificando incoming-payout:", e);
      }
    }
  } else if (newStatus === "rejected") {
    try {
      const rejectedRes = await notifyRejectedPayment({
        payment_id: payment.id,
        buyer_id: payment.buyer_internal_id ?? payment.buyer_id,
        amount: { value: payment.amount, currency: payment.currency },
        created_at: payment.createdAt.toISOString(),
      });
      console.log("[MP Webhook] rejected-payment acknowledged:", rejectedRes);
    } catch (e) {
      console.error("[MP Webhook] Error notificando rejected-payment:", e);
    }

    if (payment.order_id) {
      try {
        const stockRejectRes = await notifyStockReservationRejected(
          payment.order_id,
        );
        console.log(
          "[MP Webhook] stock-reservation rejected acknowledged:",
          stockRejectRes,
        );
      } catch (e) {
        console.error(
          "[MP Webhook] Error notificando stock-reservation reject:",
          e,
        );
      }
    } else {
      console.warn(
        "[MP Webhook] order_id es null, saltando notificación de stock",
      );
    }
  }
}

async function processPayment(paymentId: string) {
  const paymentClient = new Payment(client);
  const mpPayment = await paymentClient.get({ id: paymentId });

  const externalReference = mpPayment.external_reference;
  const status = mpPayment.status;
  const paymentType = mpPayment.payment_type_id;

  if (!externalReference) {
    throw new Error("No external reference en el pago " + paymentId);
  }

  console.log("[MP Webhook] estado en MP:", {
    status: mpPayment.status,
    external_reference: mpPayment.external_reference,
  });

  const statusMap: Record<string, string> = {
    approved: "approved",
    rejected: "rejected",
    pending: "pending",
    in_process: "pending",
  };

  const newStatus = statusMap[status ?? ""] ?? "pending";

  console.log(
    "[MP Webhook][processPayment] Payment",
    externalReference,
    "— status MP:",
    status,
    "→ mapeado a:",
    newStatus,
  );

  const updatedPayment = await prisma.payment.update({
    where: { id: Number(externalReference) },
    data: { status: newStatus, payment_type: paymentType },
  });

  console.log(
    "[MP Webhook][processPayment] Payment",
    externalReference,
    "actualizado en BD:",
    updatedPayment.status,
  );

  let payout = null;

  if (newStatus === "approved") {
    payout = await prisma.payout.create({
      data: {
        payment_id: updatedPayment.id,
        seller_id: updatedPayment.seller_id,
        seller_email: updatedPayment.seller_email ?? null,
        buyer_email: updatedPayment.buyer_email ?? null,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: "paid",
      },
    });
  }

  await firePaymentNotifications(newStatus, updatedPayment, payout);
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const urlParams = new URL(req.url).searchParams;
    const topic = urlParams.get("topic");
    const urlId = urlParams.get("id");

    console.log("[MP Webhook] headers:", {
      "x-signature": req.headers.get("x-signature"),
      "x-request-id": req.headers.get("x-request-id"),
      "content-type": req.headers.get("content-type"),
    });
    console.log("[MP Webhook] query params:", { topic, id: urlId });
    console.log("[MP Webhook] raw body:", rawBody || "(vacío)");

    // ── FORMATO LEGACY (?topic=... en la URL) ────────────────────────────────
    // MP envía este formato por compatibilidad pero no incluye firma válida.
    // Lo procesamos directo si es topic=payment, ignoramos el resto.
    if (topic) {
      if (topic === "payment" && urlId) {
        console.log(
          "[MP Webhook] formato legacy — procesando sin verificar firma",
        );
        await processPayment(urlId);
        return NextResponse.json({ received: true });
      }
      // merchant_order y cualquier otro topic legacy: ignorar
      console.log("[MP Webhook] formato legacy — ignorando topic:", topic);
      return NextResponse.json({ received: true });
    }

    // ── FORMATO NUEVO (body JSON + x-signature) ───────────────────────────────
    const signatureValid = verifyMPSignature(req);
    console.log("[MP Webhook] firma válida:", signatureValid);

    if (!signatureValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!rawBody.trim()) {
      return NextResponse.json({ error: "Body vacío" }, { status: 400 });
    }

    let body: { type?: string; data?: { id?: string } };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    // Solo procesar notificaciones de tipo payment
    if (body.type !== "payment") {
      console.log("[MP Webhook] ignorando notificación de tipo:", body.type);
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    console.log("[MP Webhook] paymentId resuelto:", paymentId);

    if (!paymentId) {
      return NextResponse.json({ error: "No payment id" }, { status: 400 });
    }

    await processPayment(paymentId);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[POST /api/webhooks/mercadopago]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
