import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPreference } from "@/services/mercadopagoService";

export async function POST(req: NextRequest) {
  try {
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
        status: "pending",
        buyer_email: body.buyer_email ?? null, //corregir es algo que se puede sacar de la BD
      },
    });
    let mpData = {};
    if (body.buyer_email) {
      const preference = await createPreference({
        paymentId: payment.id,
        title: `Orden ${body.order_id}`,
        amount: body.amount,
        currency: body.currency ?? "ARS",
        buyerEmail: body.buyer_email,
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          mp_preference_id: preference.id ?? null,
          mp_init_point: preference.init_point ?? null,
        },
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
  } catch (error) {
    console.error("[POST /api/payments]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
