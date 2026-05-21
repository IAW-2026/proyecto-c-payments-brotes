import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPreference } from "@/services/mercadopagoService";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_id, buyer_id, seller_id, amount, currency } = body;
  if (!order_id || !buyer_id || !seller_id || !amount) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios." },
      { status: 400 },
    );
  }

  const payment = await prisma.payment.create({
    data: {
      order_id,
      buyer_id,
      seller_id,
      amount,
      currency: currency ?? "ARS",
      status: "approved",
      buyer_email: body.buyer_email ?? null,
    },
  });

  if (payment.status === "approved") {
    await prisma.payout.create({
      data: {
        payment_id: payment.id,
        seller_id: payment.seller_id,
        amount: payment.amount,
        currency: payment.currency,
        status: "pending",
      },
    });
  }
  let mpData = {};
  if (body.buyer_email) {
    const preference = await createPreference({
      paymentId: payment.id,
      title: `Orden ${body.order_id}`,
      amount: body.amount,
      currency: body.currency ?? "ARS",
      buyerEmail: body.buyer_email,
    });
    mpData = {
      mp_preference_id: preference.id,
      mp_init_point: preference.init_point,
    };
  }
  return NextResponse.json(
    {
      payment_id: payment.id,
      order_id: payment.order_id,
      status: payment.status,
      amount: { value: payment.amount, currency: payment.currency },
      created_at: payment.createdAt,
      ...mpData,
    },
    { status: 201 },
  );
}
