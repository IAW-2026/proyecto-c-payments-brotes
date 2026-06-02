import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const thirtySecondsAgo = new Date(Date.now() - 30_000);

    const result = await prisma.payout.updateMany({
      where: {
        status: "pending",
        createdAt: { lt: thirtySecondsAgo },
      },
      data: {
        status: "paid",
        accreditedAt: new Date(),
      },
    });

    console.log(
      `[CRON] payouts acreditados: ${result.count}`,
    );

    return NextResponse.json({ accredited: result.count });
  } catch (error) {
    console.error("[CRON /api/cron/accredit-payouts]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
