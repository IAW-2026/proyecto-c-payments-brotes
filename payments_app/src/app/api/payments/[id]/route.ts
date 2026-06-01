import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PaymentIdSchema,
  UpdatePaymentStatusSchema,
} from "@/lib/validator";

async function parseId(params: Promise<{ id: string }>) {
  const rawParams = await params;
  const result = PaymentIdSchema.safeParse(rawParams);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: "ID de pago inválido.",
          details: result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      ),
    };
  }
  return { id: result.data.id };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = await parseId(params);
    if ("error" in parsed) return parsed.error;

    const payment = await prisma.payment.findUnique({
      where: { id: parsed.id },
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
  } catch (error) {
    console.log("[GET /api/payments/:id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = await parseId(params);
    if ("error" in parsed) return parsed.error;

    const body = await req.json();
    const bodyResult = UpdatePaymentStatusSchema.safeParse(body);
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

    const existing = await prisma.payment.findUnique({
      where: { id: parsed.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: "Solo se pueden cambiar pagos en estado 'pending'." },
        { status: 400 },
      );
    }

    const updated = await prisma.payment.update({
      where: { id: parsed.id },
      data: { status: newStatus },
    });

    if (newStatus === "approved") {
      await prisma.payout.create({
        data: {
          payment_id: updated.id,
          seller_id: updated.seller_id,
          seller_email: updated.seller_email ?? null,
          buyer_email: updated.buyer_email ?? null,
          amount: updated.amount,
          currency: updated.currency,
          status: "pending",
        },
      });
    }

    return NextResponse.json({
      payment_id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("[PATCH /api/payments/:id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = await parseId(params);
    if ("error" in parsed) return parsed.error;

    const existing = await prisma.payment.findUnique({
      where: { id: parsed.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.payment.delete({ where: { id: parsed.id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/payments/:id]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
