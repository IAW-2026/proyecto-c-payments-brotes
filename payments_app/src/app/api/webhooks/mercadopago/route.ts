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

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string]),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = [
    dataId ? `id:${dataId}` : null,
    xRequestId ? `request-id:${xRequestId}` : null,
    `ts:${ts}`,
  ]
    .filter(Boolean)
    .join(";");

  const secret = process.env.MP_WEBHOOK_SECRET!;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === v1;
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!verifyMPSignature(req)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const urlParams = new URL(req.url).searchParams;
    const topic = urlParams.get("topic");
    const urlId = urlParams.get("id");

    // Intentar obtener paymentId del body (nuevo formato) o URL params (legacy)
    let paymentId: string | string[] | undefined;

    if (rawBody.trim()) {
      try {
        const body = JSON.parse(rawBody);
        // Nuevo formato: body.type indica si es notificación de pago
        if (body.type && body.type !== "payment") {
          return NextResponse.json({ received: true });
        }
        paymentId = body.data?.id;
      } catch {
        // body no es JSON o está vacío — usar fallback legacy
      }
    }

    // Legacy: topic e id vienen como query params
    if (!paymentId) {
      if (topic === "payment" && urlId) {
        paymentId = urlId;
      } else if (topic === "merchant_order" && urlId) {
        return NextResponse.json({ received: true });
      }
    }

    if (!paymentId) {
      return NextResponse.json({ error: "No payment id" }, { status: 400 });
    }

    // Consultamos el pago directamente a MP
    const payment = new Payment(client);
    const mpPayment = await payment.get({ id: paymentId as string });

    const externalReference = mpPayment.external_reference; // nuestro paymentId
    const status = mpPayment.status; // approved, rejected, pending

    if (!externalReference) {
      return NextResponse.json(
        { error: "No external reference" },
        { status: 400 },
      );
    }

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
