import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  // MP manda distintos tipos de notificaciones
  if (body.type !== "payment") {
    return NextResponse.json({ received: true });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "No payment id" }, { status: 400 });
  }

  // Consultamos el pago directamente a MP
  const payment = new Payment(client);
  const mpPayment = await payment.get({ id: paymentId });

  const externalReference = mpPayment.external_reference; // nuestro paymentId
  const status = mpPayment.status; // approved, rejected, pending

  if (!externalReference) {
    return NextResponse.json(
      { error: "No external reference" },
      { status: 400 },
    );
  }

  // Mapeamos el estado de MP al nuestro
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
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: "pending",
      },
    });
  }
  return NextResponse.json({ received: true });
}
