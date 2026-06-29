import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SellerIdSchema,
  PayoutIdSchema,
  UpdatePayoutStatusSchema,
} from "@/lib/validator";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> },
) {
  try {
    const rawParams = await params;
    const idResult = PayoutIdSchema.safeParse(rawParams);
    if (!idResult.success) {
      return NextResponse.json(
        {
          error: "ID de acreditación inválido.",
          details: idResult.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { sellerId: payoutId } = idResult.data;

    const body = await req.json();
    const bodyResult = UpdatePayoutStatusSchema.safeParse(body);
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

    const existing = await prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Acreditación no encontrada." },
        { status: 404 },
      );
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Solo se pueden cambiar acreditaciones en estado 'pending'." },
        { status: 400 },
      );
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: { status: newStatus },
    });

    return NextResponse.json({
      payout_id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("[PATCH /api/payouts/:id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> },
) {
  try {
    const rawParams = await params;
    const idResult = PayoutIdSchema.safeParse(rawParams);
    if (!idResult.success) {
      return NextResponse.json(
        {
          error: "ID de acreditación inválido.",
          details: idResult.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const { sellerId: payoutId } = idResult.data;

    const existing = await prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Acreditación no encontrada." },
        { status: 404 },
      );
    }

    await prisma.payout.delete({ where: { id: payoutId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/payouts/:id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
