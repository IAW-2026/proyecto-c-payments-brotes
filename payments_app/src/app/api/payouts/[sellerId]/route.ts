import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SellerIdSchema } from "@/lib/validator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> },
) {
  try {
    const rawParams = await params;

    const result = SellerIdSchema.safeParse(rawParams);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Parámetro inválido.",
          details: result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { sellerId } = result.data;

    const payouts = await prisma.payout.findMany({
      where: { seller_id: sellerId },
      orderBy: { createdAt: "desc" },
    });

    const total = payouts
      .filter((p) => p.status === "paid")
      .reduce((acc, p) => acc + p.amount, 0);

    const currency = payouts[0]?.currency ?? "ARS";

    return NextResponse.json({
      seller_id: sellerId,
      payouts: payouts.map((p) => ({
        payout_id: p.id,
        payment_id: p.payment_id,
        amount: { value: p.amount, currency: p.currency },
        status: p.status,
        created_at: p.createdAt,
      })),
      total_paid: { value: total, currency },
    });
  } catch (error) {
    console.error("[GET /api/payouts/:sellerId]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
