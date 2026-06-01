import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PaymentIdSchema } from "@/lib/validator";

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
      select: { buyer_id: true, status: true },
    });

    if (!payment || payment.buyer_id !== userId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
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
              select: { status: true },
            });

            if (!current) {
              send(
                `data: ${JSON.stringify({ error: "Pago no encontrado" })}\n\n`,
              );
              cleanup();
              return;
            }

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
