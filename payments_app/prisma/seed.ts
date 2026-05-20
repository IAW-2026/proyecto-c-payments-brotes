import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const BUYER_ID = "user_3Dv1ps1sKzwvsFhcto5WdgOgBMb";
const SELLER_ID = "seller_test_001";

async function main() {
  console.log("🌿 Seeding plant marketplace payments...");

  // Limpiar datos previos del buyer de prueba
  // Buscar payments previos
  const existingPayments = await prisma.payment.findMany({
    where: { buyer_id: BUYER_ID },
    select: { id: true },
  });

  const paymentIds = existingPayments.map((p) => p.id);

  // Borrar payouts relacionados
  await prisma.payout.deleteMany({
    where: {
      payment_id: {
        in: paymentIds,
      },
    },
  });

  // Borrar payments
  await prisma.payment.deleteMany({
    where: {
      buyer_id: BUYER_ID,
    },
  });

  // Pago 1 — pending
  await prisma.payment.create({
    data: {
      order_id: "order_001",
      amount: 18500,
      currency: "ARS",
      status: "pending",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Monstera Deliciosa mediana con maceta de cerámica",
    },
  });

  // Pago 2 — pending
  await prisma.payment.create({
    data: {
      order_id: "order_002",
      amount: 7200,
      currency: "ARS",
      status: "pending",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Kit de herramientas para jardinería indoor",
    },
  });

  // Pago 3 — approved (con payout pagado)
  const approvedPayment = await prisma.payment.create({
    data: {
      order_id: "order_003",
      amount: 29500,
      currency: "ARS",
      status: "approved",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Olivo joven premium para exterior",
    },
  });

  await prisma.payout.create({
    data: {
      payment_id: approvedPayment.id,
      seller_id: SELLER_ID,
      amount: approvedPayment.amount,
      currency: "ARS",
      status: "paid",
    },
  });

  // Pago 4 — approved (payout pendiente)
  const approvedPayment2 = await prisma.payment.create({
    data: {
      order_id: "order_004",
      amount: 9600,
      currency: "ARS",
      status: "approved",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Pack x3 cactus decorativos + sustrato mineral",
    },
  });

  await prisma.payout.create({
    data: {
      payment_id: approvedPayment2.id,
      seller_id: SELLER_ID,
      amount: approvedPayment2.amount,
      currency: "ARS",
      status: "pending",
    },
  });

  // Pago 5 — rejected
  await prisma.payment.create({
    data: {
      order_id: "order_005",
      amount: 13400,
      currency: "ARS",
      status: "rejected",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Ficus Lyrata grande para living",
    },
  });

  // Pago 6 — pending
  await prisma.payment.create({
    data: {
      order_id: "order_006",
      amount: 5400,
      currency: "ARS",
      status: "pending",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Fertilizante orgánico líquido para plantas de interior",
    },
  });

  console.log(
    "✅ Seed completo — 6 pagos creados (3 pending, 2 approved, 1 rejected)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
