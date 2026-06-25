import { NextRequest, NextResponse } from "next/server";
import { verifyServiceApiKey } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const STATUS_MAP: Record<string, string> = {
  pending: "pendiente",
  approved: "confirmado",
  rejected: "cancelado",
};

export async function GET(req: NextRequest) {
  const authError = verifyServiceApiKey(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    let limit = 10;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 50);
      }
    }

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        order_id: true,
        amount: true,
        status: true,
        createdAt: true,
        buyer_email: true,
        seller_email: true,
      },
    });

    const ultimasTransacciones = payments.map((p) => {
      const estado = STATUS_MAP[p.status] ?? p.status;
      const fecha = p.createdAt.toISOString().split("T")[0];

      let compradorNombre = p.buyer_email ?? "Comprador";
      let vendedorNombre = p.seller_email ?? "Vendedor";

      // Limpiar el email para mostrar un nombre más amigable si no hay nombre real
      if (compradorNombre.includes("@")) {
        const localPart = compradorNombre.split("@")[0];
        compradorNombre = localPart
          .split(".")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");
      }
      if (vendedorNombre.includes("@")) {
        const localPart = vendedorNombre.split("@")[0];
        vendedorNombre = localPart
          .split(".")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");
      }

      return {
        id: p.order_id ?? p.id,
        compradorNombre,
        vendedorNombre,
        monto: p.amount,
        estado,
        fecha,
        metodoPago: "MercadoPago",
      };
    });

    return NextResponse.json({ ultimasTransacciones });
  } catch (error) {
    console.error("[GET /api/analytics/transactions]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
