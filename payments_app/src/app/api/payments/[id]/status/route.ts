import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PaymentIdSchema } from "@/lib/validator";
import { notifyRejectedPayment } from "@/services/buyerService";
import { notifyStockReservationRejected } from "@/services/sellerService";

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

const TERMINAL_STATUSES = new Set(["approved", "rejected"]);
const EXPIRATION_MINUTES = 5;

async function checkAndExpire(
  payment: {
    id: string;
    status: string;
    createdAt: Date;
    order_id: string;
    buyer_id: string;
    buyer_internal_id: number | null;
    amount: number;
    currency: string;
  },
  send: (data: string) => void,
  cleanup: () => void,
) {
  if (payment.status !== "pending") return false;

  const minutesElapsed =
    (Date.now() - payment.createdAt.getTime()) / 1000 / 60;
  if (minutesElapsed <= EXPIRATION_MINUTES) return false;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "rejected" },
  });

  send(`data: ${JSON.stringify({ status: "rejected" })}\n\n`);

  try {
    const rejectedRes = await notifyRejectedPayment({
      payment_id: payment.id,
      buyer_id: payment.buyer_internal_id ?? payment.buyer_id,
      amount: { value: payment.amount, currency: payment.currency },
      created_at: payment.createdAt.toISOString(),
    });
    console.log("[SSE] rejected-payment acknowledged:", rejectedRes);
  } catch (e) {
    console.error("[SSE] Error notificando rejected-payment:", e);
  }

  if (payment.order_id) {
    try {
      const stockRejectRes = await notifyStockReservationRejected(payment.order_id);
      console.log("[SSE] stock-reservation rejected acknowledged:", stockRejectRes);
    } catch (e) {
      console.error("[SSE] Error notificando stock-reservation reject:", e);
    }
  }

  cleanup();
  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsed = await parseId(params);
    if ("error" in parsed) return parsed.error;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: parsed.id },
      select: {
        id: true,
        buyer_id: true,
        buyer_internal_id: true,
        status: true,
        createdAt: true,
        order_id: true,
        amount: true,
        currency: true,
      },
    });

    if (!payment || payment.buyer_id !== userId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        let interval: ReturnType<typeof setInterval> | null = null;

        const send = (data: string) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            // stream already cancelled
          }
        };

        const cleanup = () => {
          if (closed) return;
          closed = true;
          if (interval) clearInterval(interval);
          try {
            controller.close();
          } catch {
            // already closed or cancelled
          }
        };

        // Check expiration before sending initial status
        const expired = await checkAndExpire(payment, send, cleanup);
        if (expired) return;

        // Send current status immediately
        send(`data: ${JSON.stringify({ status: payment.status })}\n\n`);

        // Already terminal — close immediately
        if (TERMINAL_STATUSES.has(payment.status)) {
          cleanup();
          return;
        }

        interval = setInterval(async () => {
          try {
            const current = await prisma.payment.findUnique({
              where: { id: parsed.id },
              select: {
                id: true,
                status: true,
                createdAt: true,
                order_id: true,
                buyer_id: true,
                buyer_internal_id: true,
                amount: true,
                currency: true,
              },
            });

            if (!current) {
              send(
                `data: ${JSON.stringify({ error: "Pago no encontrado" })}\n\n`,
              );
              cleanup();
              return;
            }

            // Check expiration before emitting status
            const expired = await checkAndExpire(current, send, cleanup);
            if (expired) return;

            send(
              `data: ${JSON.stringify({ status: current.status })}\n\n`,
            );

            if (TERMINAL_STATUSES.has(current.status)) {
              cleanup();
            }
          } catch {
            send(
              `data: ${JSON.stringify({
                error: "Error al consultar estado",
              })}\n\n`,
            );
            cleanup();
          }
        }, 3_000);

        req.signal.addEventListener("abort", cleanup, { once: true });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[SSE /api/payments/:id/status]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
