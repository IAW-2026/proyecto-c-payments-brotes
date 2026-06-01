import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const BUYER_ID = "user_3Dv1ps1sKzwvsFhcto5WdgOgBMb";
const SELLER_ID = "user_3E1w6lYJ5OVh0A9PCa33alsZcSG";

async function main() {
  console.log("🌿 Seeding plant marketplace payments...");

  // Limpiar todo
  await prisma.payout.deleteMany({});
  await prisma.payment.deleteMany({});

  // Pago 1 — pending
  await prisma.payment.create({
    data: {
      order_id: "order_001",
      amount: 18500,
      currency: "ARS",
      status: "pending",
      buyer_id: BUYER_ID,
      seller_id: SELLER_ID,
      seller_email: "seller01@brotes.com",
      buyer_email: "buyer01@brotes.com",
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
      seller_email: "seller01@brotes.com",
      buyer_email: "buyer01@brotes.com",
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
      seller_email: "seller01@brotes.com",
      buyer_email: "buyer01@brotes.com",
      description: "Olivo joven premium para exterior",
    },
  });

  await prisma.payout.create({
    data: {
      payment_id: approvedPayment.id,
      seller_id: SELLER_ID,
      seller_email: "seller01@brotes.com",
      buyer_email: "buyer01@brotes.com",
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
      seller_email: "seller01@brotes.com",
      buyer_email: "buyer01@brotes.com",
      description: "Pack x3 cactus decorativos + sustrato mineral",
    },
  });

  await prisma.payout.create({
    data: {
      payment_id: approvedPayment2.id,
      seller_id: SELLER_ID,
      seller_email: "seller01@brotes.com",
      buyer_email: "buyer01@brotes.com",
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
      seller_email: "seller01@brotes.com",
      buyer_email: "buyer01@brotes.com",
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
      seller_email: "seller01@brotes.com",
      buyer_email: "buyer01@brotes.com",
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
