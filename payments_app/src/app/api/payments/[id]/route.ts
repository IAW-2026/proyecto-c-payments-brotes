import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
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
}
