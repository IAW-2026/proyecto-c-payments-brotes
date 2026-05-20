import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BUYER_ID = "user_3Dv1ps1sKzwvsFhcto5WdgOgBMb"; // ← reemplazá esto
const SELLER_ID = "seller_test_001";

async function main() {
  console.log("🌱 Seeding payments...");

  // Limpiar datos previos del buyer de prueba
  await prisma.payment.deleteMany({ where: { buyer_id: BUYER_ID } });

  // Pago 1 — pending
  await prisma.payment.create({
    data: {
      order_id: "order_001",
      amount: 15000,
      currency: "ARS",
      status: "pending",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Zapatillas Nike Air Max",
    },
  });

  // Pago 2 — pending
  await prisma.payment.create({
    data: {
      order_id: "order_002",
      amount: 8500,
      currency: "ARS",
      status: "pending",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Auriculares Sony WH-1000XM4",
    },
  });

  // Pago 3 — approved (con su Payout asociado)
  const approvedPayment = await prisma.payment.create({
    data: {
      order_id: "order_003",
      amount: 32000,
      currency: "ARS",
      status: "approved",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: "Tablet Samsung Galaxy Tab",
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
      amount: 5200,
      currency: "ARS",
      status: "approved",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      description: 'Funda para laptop 15"',
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

  console.log("✅ Seed completo — 4 pagos creados (2 pending, 2 approved)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
