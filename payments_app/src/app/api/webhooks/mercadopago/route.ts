import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { createHmac } from "crypto";

function verifyMPSignature(req: NextRequest): boolean {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  const urlParams = new URL(req.url).searchParams;
  const dataId = urlParams.get("data.id") ?? urlParams.get("id");

  if (!xSignature) return false;

  // Fix #2: usar indexOf para no cortar si el valor tiene "=" internamente
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const idx = p.indexOf("=");
      return [p.slice(0, idx).trim(), p.slice(idx + 1).trim()];
    }),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Fix #1: el manifest debe terminar con ";" según la doc de MP
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

  // Log de diagnóstico: muestra exactamente qué se está firmando y qué espera MP
  console.log("[MP Webhook] diagnóstico de firma:", {
    dataId,
    xRequestId,
    ts,
    manifest, // lo que estamos firmando nosotros
    expected, // lo que nuestro HMAC produce
    receivedV1: v1, // lo que MP nos mandó
    match: expected === v1,
  });

  return expected === v1;
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

    // merchant_order no tiene firma — ignorar directamente sin verificar
    if (topic === "merchant_order") {
      console.log("[MP Webhook] ignorando merchant_order");
      return NextResponse.json({ received: true });
    }

    // Solo verificar firma para notificaciones que la incluyen
    const signatureValid = verifyMPSignature(req);
    console.log("[MP Webhook] firma válida:", signatureValid);

    if (!signatureValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Intentar obtener paymentId del body (nuevo formato) o URL params (legacy)
    let paymentId: string | undefined;

    if (rawBody.trim()) {
      try {
        const body = JSON.parse(rawBody);
        // Nuevo formato: body.type indica si es notificación de pago
        if (body.type && body.type !== "payment") {
          console.log(
            "[MP Webhook] ignorando notificación de tipo:",
            body.type,
          );
          return NextResponse.json({ received: true });
        }
        paymentId = body.data?.id;
      } catch {
        // body no es JSON o está vacío — usar fallback legacy
        console.log(
          "[MP Webhook] body no es JSON válido, usando fallback legacy",
        );
      }
    }

    // Legacy: topic e id vienen como query params
    if (!paymentId) {
      if (topic === "payment" && urlId) {
        paymentId = urlId;
      } else if (!topic && !urlId) {
        console.log(
          "[MP Webhook] sin paymentId resuelto — topic:",
          topic,
          "urlId:",
          urlId,
        );
      }
    }

    console.log("[MP Webhook] paymentId resuelto:", paymentId);

    if (!paymentId) {
      return NextResponse.json({ error: "No payment id" }, { status: 400 });
    }

    // Consultamos el pago directamente a MP
    const payment = new Payment(client);
    const mpPayment = await payment.get({ id: paymentId });

    const externalReference = mpPayment.external_reference;
    const status = mpPayment.status;

    if (!externalReference) {
      return NextResponse.json(
        { error: "No external reference" },
        { status: 400 },
      );
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

    const updatedPayment = await prisma.payment.update({
      where: { id: externalReference },
      data: { status: newStatus },
    });

    if (newStatus === "approved") {
      await prisma.payout.create({
        data: {
          payment_id: updatedPayment.id,
          seller_id: updatedPayment.seller_id,
          seller_email: updatedPayment.seller_email ?? null,
          buyer_email: updatedPayment.buyer_email ?? null,
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          status: "pending",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[POST /api/webhooks/mercadopago]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
