import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPreference } from "@/services/mercadopagoService";
import { CreatePaymentSchema } from "@/lib/validator";
import { getSellerEmail, getSellerProduct } from "@/services/sellerService";
import { getOrder } from "@/services/buyerService";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[POST /api/payments] body recibido:", body);

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
      buyer_internal_id,
      seller_internal_id,
    } = result.data;
    let sellerEmail: string | null = null;
    try {
      sellerEmail = await getSellerEmail(seller_id);
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
        seller_email: sellerEmail,
        buyer_internal_id: buyer_internal_id ?? null,
        seller_internal_id: seller_internal_id ?? null,
      },
    });

    let paymentDescription = payment.description;

    if (!paymentDescription) {
      try {
        const order = await getOrder(order_id);
        if (order?.items?.length) {
          const sellerNumericId = Number(order.seller_id);

          type OrderItem = {
            product_id: number | string;
            product_name: string;
            quantity: number;
          };

          const enrichedItems = await Promise.all(
            order.items.map(async (item: OrderItem) => {
              if (!isNaN(sellerNumericId)) {
                try {
                  const product = await getSellerProduct(
                    sellerNumericId,
                    Number(item.product_id),
                  );
                  if (product?.name) {
                    return { name: product.name, quantity: item.quantity };
                  }
                } catch {}
              }
              return { name: item.product_name, quantity: item.quantity };
            }),
          );

          paymentDescription = enrichedItems
            .map((i) =>
              i.quantity > 1 ? `${i.name} x${i.quantity}` : i.name,
            )
            .join(", ")
            .slice(0, 255);

          await prisma.payment.update({
            where: { id: payment.id },
            data: { description: paymentDescription },
          });
        }
      } catch (e) {
        console.warn(
          "[POST /api/payments] No se pudo obtener descripción desde Buyer App",
          e,
        );
      }
    }

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

    console.log("[POST /api/payments] payment creado:", payment.id);

    return NextResponse.json(
      {
        payment_id: payment.id,
        order_id: payment.order_id,
        status: payment.status,
        amount: { value: payment.amount, currency: payment.currency },
        description: paymentDescription,
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
