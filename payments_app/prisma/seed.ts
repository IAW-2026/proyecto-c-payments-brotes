import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ── Usuarios ──────────────────────────────────────────────────────────────────
const SELLERS = [
  {
    id: "user_3EY8eNUrPs0VhCcEgynSR20YA05",
    email: "seller4+clerktest@iaw.com",
  },
  {
    id: "user_3EY7pCE7PB56pVV0nQuuACvxeQd",
    email: "seller3+clerk_test@iaw.com",
  },
  {
    id: "user_3EY7jNuQR1CNBssPx6BMQVtkDB0",
    email: "seller2+clerk_test@iaw.com",
  },
  {
    id: "user_3EY7eSzyIkdMpeDaQmaVna6SSOa",
    email: "seller+clerk_test@iaw.com",
  },
  {
    id: "user_3ESZOJBm1v49y1x3y8br5L8q8mZ",
    email: "sellerpayment+clerck_test@iaw.com",
  },
];

const BUYERS = [
  {
    id: "user_3ESZHyslApaWLKOxtqdNXdw7LRI",
    email: "buyerpayment+clerk_test@iaw.com",
  },
  { id: "user_3EXaprWcBdQ9Yw6s2dSY5uU35Zk", email: "buyer+clerk_test@iaw.com" },
  {
    id: "user_3EVaDPLqTeXx6xCWfvefncYPh6o",
    email: "lucasvalentin.villarreal@hotmail.com",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysAgo(days: number, extraHours = 0): Date {
  return new Date(Date.now() - (days * 24 + extraHours) * 60 * 60 * 1000);
}

// ── Productos ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    description: "Monstera Deliciosa mediana con maceta de cerámica",
    amount: 18500,
  },
  { description: "Olivo joven premium para exterior", amount: 29500 },
  { description: "Ficus Lyrata grande para living", amount: 24900 },
  { description: "Kit de herramientas para jardinería indoor", amount: 7200 },
  {
    description: "Pack x3 cactus decorativos + sustrato mineral",
    amount: 9600,
  },
  {
    description: "Fertilizante orgánico líquido para plantas de interior",
    amount: 5400,
  },
  {
    description: "Orquídea Phalaenopsis blanca en maceta de vidrio",
    amount: 12800,
  },
  { description: "Lavanda francesa en maceta de terracota", amount: 6900 },
  { description: "Potus colgante con maceta de mimbre", amount: 8400 },
  { description: "Bonsái Ficus retusa 10 años", amount: 45000 },
  { description: "Suculentas mix x6 con caja de madera", amount: 11200 },
  {
    description: "Helecho Boston grande con maceta plástica negra",
    amount: 7800,
  },
  { description: "Palmera Areca mediana para interiores", amount: 22000 },
  { description: "Kit riego por goteo para balcón", amount: 15600 },
  { description: "Tierra negra premium 10 litros", amount: 3200 },
  { description: "Calathea Orbifolia hoja ancha", amount: 16500 },
  { description: "Perlita y vermiculita mix 5 litros", amount: 4100 },
  { description: "Maceta autorregante blanca 20cm", amount: 6300 },
  { description: "Cactus San Pedro mediano", amount: 13700 },
  { description: "Aloe Vera triple hoja en maceta de barro", amount: 5900 },
];

async function main() {
  console.log("🌿 Seeding plant marketplace payments...");

  await prisma.payout.deleteMany({});
  await prisma.payment.deleteMany({});

  let orderCounter = 1;
  const pad = (n: number) => String(n).padStart(3, "0");

  // ── Approved + payout paid (distribuidos en los últimos 30 días) ─────────────
  const approvedPaidCases = [
    {
      daysBack: 28,
      product: PRODUCTS[9],
      seller: SELLERS[0],
      buyer: BUYERS[2],
    },
    {
      daysBack: 25,
      product: PRODUCTS[2],
      seller: SELLERS[1],
      buyer: BUYERS[0],
    },
    {
      daysBack: 22,
      product: PRODUCTS[12],
      seller: SELLERS[2],
      buyer: BUYERS[1],
    },
    {
      daysBack: 19,
      product: PRODUCTS[4],
      seller: SELLERS[3],
      buyer: BUYERS[2],
    },
    {
      daysBack: 15,
      product: PRODUCTS[0],
      seller: SELLERS[4],
      buyer: BUYERS[0],
    },
    {
      daysBack: 12,
      product: PRODUCTS[15],
      seller: SELLERS[0],
      buyer: BUYERS[1],
    },
    {
      daysBack: 9,
      product: PRODUCTS[18],
      seller: SELLERS[1],
      buyer: BUYERS[2],
    },
    { daysBack: 6, product: PRODUCTS[7], seller: SELLERS[2], buyer: BUYERS[0] },
    {
      daysBack: 3,
      product: PRODUCTS[13],
      seller: SELLERS[3],
      buyer: BUYERS[1],
    },
    {
      daysBack: 1,
      product: PRODUCTS[19],
      seller: SELLERS[4],
      buyer: BUYERS[2],
    },
  ];

  for (const c of approvedPaidCases) {
    const createdAt = daysAgo(c.daysBack);
    const payment = await prisma.payment.create({
      data: {
        order_id: `order_${pad(orderCounter++)}`,
        amount: c.product.amount,
        currency: "ARS",
        status: "approved",
        buyer_id: c.buyer.id,
        seller_id: c.seller.id,
        buyer_email: c.buyer.email,
        seller_email: c.seller.email,
        description: c.product.description,
        createdAt,
        updatedAt: createdAt,
      },
    });
    await prisma.payout.create({
      data: {
        payment_id: payment.id,
        seller_id: c.seller.id,
        seller_email: c.seller.email,
        buyer_email: c.buyer.email,
        amount: payment.amount,
        currency: "ARS",
        status: "paid",
        createdAt: new Date(createdAt.getTime() + 35_000),
        updatedAt: new Date(createdAt.getTime() + 35_000),
      },
    });
  }

  // ── Approved + payout pending ─────────────────────────────────────────────
  const approvedPendingCases = [
    {
      daysBack: 0,
      extraHours: 2,
      product: PRODUCTS[6],
      seller: SELLERS[0],
      buyer: BUYERS[1],
    },
    {
      daysBack: 0,
      extraHours: 5,
      product: PRODUCTS[11],
      seller: SELLERS[2],
      buyer: BUYERS[0],
    },
    {
      daysBack: 1,
      extraHours: 3,
      product: PRODUCTS[16],
      seller: SELLERS[4],
      buyer: BUYERS[2],
    },
  ];

  for (const c of approvedPendingCases) {
    const createdAt = daysAgo(c.daysBack, c.extraHours);
    const payment = await prisma.payment.create({
      data: {
        order_id: `order_${pad(orderCounter++)}`,
        amount: c.product.amount,
        currency: "ARS",
        status: "approved",
        buyer_id: c.buyer.id,
        seller_id: c.seller.id,
        buyer_email: c.buyer.email,
        seller_email: c.seller.email,
        description: c.product.description,
        createdAt,
        updatedAt: createdAt,
      },
    });
    await prisma.payout.create({
      data: {
        payment_id: payment.id,
        seller_id: c.seller.id,
        seller_email: c.seller.email,
        buyer_email: c.buyer.email,
        amount: payment.amount,
        currency: "ARS",
        status: "pending",
        createdAt: new Date(createdAt.getTime() + 35_000),
        updatedAt: new Date(createdAt.getTime() + 35_000),
      },
    });
  }

  // ── Pending (recientes, sin payout) ──────────────────────────────────────
  const pendingCases = [
    {
      daysBack: 0,
      extraHours: 0,
      product: PRODUCTS[1],
      seller: SELLERS[1],
      buyer: BUYERS[2],
    },
    {
      daysBack: 0,
      extraHours: 1,
      product: PRODUCTS[8],
      seller: SELLERS[3],
      buyer: BUYERS[0],
    },
    {
      daysBack: 0,
      extraHours: 3,
      product: PRODUCTS[17],
      seller: SELLERS[0],
      buyer: BUYERS[1],
    },
    {
      daysBack: 1,
      extraHours: 0,
      product: PRODUCTS[3],
      seller: SELLERS[2],
      buyer: BUYERS[2],
    },
  ];

  for (const c of pendingCases) {
    const createdAt = daysAgo(c.daysBack, c.extraHours);
    await prisma.payment.create({
      data: {
        order_id: `order_${pad(orderCounter++)}`,
        amount: c.product.amount,
        currency: "ARS",
        status: "pending",
        buyer_id: c.buyer.id,
        seller_id: c.seller.id,
        buyer_email: c.buyer.email,
        seller_email: c.seller.email,
        description: c.product.description,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  // ── Rejected (sin payout) ─────────────────────────────────────────────────
  const rejectedCases = [
    {
      daysBack: 20,
      product: PRODUCTS[5],
      seller: SELLERS[1],
      buyer: BUYERS[0],
    },
    {
      daysBack: 14,
      product: PRODUCTS[10],
      seller: SELLERS[3],
      buyer: BUYERS[2],
    },
    {
      daysBack: 8,
      product: PRODUCTS[14],
      seller: SELLERS[0],
      buyer: BUYERS[1],
    },
    {
      daysBack: 2,
      product: PRODUCTS[20 % PRODUCTS.length],
      seller: SELLERS[4],
      buyer: BUYERS[0],
    },
  ];

  for (const c of rejectedCases) {
    const createdAt = daysAgo(c.daysBack);
    await prisma.payment.create({
      data: {
        order_id: `order_${pad(orderCounter++)}`,
        amount: c.product.amount,
        currency: "ARS",
        status: "rejected",
        buyer_id: c.buyer.id,
        seller_id: c.seller.id,
        buyer_email: c.buyer.email,
        seller_email: c.seller.email,
        description: c.product.description,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  const total = orderCounter - 1;
  console.log(`✅ Seed completo — ${total} pagos creados:`);
  console.log(`   ${approvedPaidCases.length} approved con payout paid`);
  console.log(`   ${approvedPendingCases.length} approved con payout pending`);
  console.log(`   ${pendingCases.length} pending sin payout`);
  console.log(`   ${rejectedCases.length} rejected sin payout`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
