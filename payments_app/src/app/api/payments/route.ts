import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPreference } from "@/services/mercadopagoService";
import { CreatePaymentSchema } from "@/lib/validator";
import { clerkClient } from "@clerk/nextjs/server";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = CreatePaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos.",
          details: result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    const {
      order_id,
      buyer_id,
      seller_id,
      amount,
      currency,
      description,
      buyer_email,
    } = result.data;
    const clerk = await clerkClient();
    let sellerEmail: string | null = null;
    try {
      const seller = await clerk.users.getUser(seller_id);
      sellerEmail = seller.emailAddresses[0]?.emailAddress ?? null;
    } catch {
      console.warn(
        "[POST /api/payments] No se pudo obtener email del seller",
        seller_id,
      );
    }

    const payment = await prisma.payment.create({
      data: {
        order_id,
        buyer_id,
        seller_id,
        amount,
        currency,
        status: "pending",
        description: description ?? null,
        buyer_email: buyer_email || null,
        seller_email: sellerEmail, // nuevo
      },
    });

    let mpData = {};
    if (buyer_email) {
      const preference = await createPreference({
        paymentId: payment.id,
        title: `Orden ${order_id}`,
        amount,
        currency,
        buyerEmail: buyer_email,
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
        description: payment.description,
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
