import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  return NextResponse.json(
    {
      payment_id: payment.id,
      order_id: payment.order_id,
      status: payment.status,
      amount: { value: payment.amount, currency: payment.currency },
      created_at: payment.createdAt,
    },
    { status: 201 },
  );
}
