import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> },
) {
  const { sellerId } = await params;
  const payouts = await prisma.payout.findMany({
    where: { seller_id: sellerId },
    orderBy: { createdAt: "desc" },
  });

  const total = payouts
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);

  const currency = payouts[0]?.currency ?? "ARS";

  return NextResponse.json({
    seller_id: params.sellerId,
    payouts: payouts.map((p) => ({
      payout_id: p.id,
      payment_id: p.payment_id,
      amount: { value: p.amount, currency: p.currency },
      status: p.status,
      created_at: p.createdAt,
    })),
    total_paid: { value: total, currency },
  });
}
