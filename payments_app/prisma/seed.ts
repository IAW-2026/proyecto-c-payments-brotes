import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── Generadores de fechas ───────────────────────────────────────────────────
// Días random pero distribuidos en abril, mayo y junio 2026 (hasta el 25/06)
// con tendencia ascendente en montos mes a mes.

// Días fijos random para cada mes (sin repetir, variados)
const ABRIL_DAYS = [1, 3, 5, 7, 9, 11, 14, 16, 18, 20, 22, 24, 26, 28, 30];
const MAYO_DAYS = [2, 4, 6, 8, 10, 12, 15, 17, 19, 21, 23, 25, 27, 29, 31];
const JUNIO_DAYS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 20, 22, 24, 25];

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

let _aprilIdx = 0;
let _mayIdx = 0;
let _juneIdx = 0;

function aprilDate(): Date {
  const day = ABRIL_DAYS[_aprilIdx % ABRIL_DAYS.length];
  const hour = HOURS[_aprilIdx % HOURS.length];
  _aprilIdx++;
  return new Date(
    `2026-04-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`,
  );
}

function mayDate(): Date {
  const day = MAYO_DAYS[_mayIdx % MAYO_DAYS.length];
  const hour = HOURS[(_mayIdx + 3) % HOURS.length];
  _mayIdx++;
  return new Date(
    `2026-05-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`,
  );
}

function juneDate(): Date {
  const day = JUNIO_DAYS[_juneIdx % JUNIO_DAYS.length];
  const hour = HOURS[(_juneIdx + 5) % HOURS.length];
  _juneIdx++;
  return new Date(
    `2026-06-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`,
  );
}

function payoutDate(base: Date, offsetDays: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

// ─── Sellers (clerk IDs alineados al sellers seed) ───────────────────────────
// seller_id en orders del compañero son integers 1-20
// Los mapeamos a clerk IDs simulados
const S = (n: number) => `seed_seller_${String(n).padStart(3, "0")}`;
const sellerEmail = (n: number) => `seller${n}@brotes.com`;

// ─── Buyers (clerk IDs alineados al buyers seed) ─────────────────────────────
const B = (n: number) => `seed_buyer_${String(n).padStart(3, "0")}`;
const buyerEmail = (n: number, name: string) => `${name}@brotes.com`;

// ─── mp helpers ──────────────────────────────────────────────────────────────
function prefId(paymentId: number) {
  return `MP-PREF-${paymentId}`;
}
function initPoint(pref: string) {
  return `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${pref}`;
}

// ─── Tipos de pago variados ───────────────────────────────────────────────────
const PT = [
  "credit_card",
  "debit_card",
  "ticket",
  "bank_transfer",
  "account_money",
];
const pt = (i: number) => PT[i % PT.length];

// ─── Multiplicador de mes (tendencia ascendente ~8% mensual) ─────────────────
// Los montos del seed del compañero están en ARS (8.000 – 120.000)
// Los usamos directamente como base; payments app trabaja con los mismos valores.

async function main() {
  console.log("🌱 Iniciando seed de payments...");

  await prisma.payout.deleteMany();
  await prisma.payment.deleteMany();

  console.log("🧹 Tablas limpiadas");

  // ════════════════════════════════════════════════════════════════════════════
  // ABRIL 2026 — payment_ids históricos originales 2001-2014 + nuevos
  // Montos base bajos/medios (8.000 – 75.000 ARS)
  // ════════════════════════════════════════════════════════════════════════════
  console.log("📅 Creando payments de Abril...");

  // Todos los pagos aprobados corresponden a órdenes con payment_id en el seed
  // del compañero. Los tomamos tal cual para que los IDs crucen.
  // payment_id en la Order es un Int externo; nosotros lo guardamos en order_id.

  type PaymentInput = {
    order_id: string;
    buyer_id: string;
    seller_id: string;
    buyer_email: string;
    seller_email: string;
    buyer_internal_id: number;
    seller_internal_id: number;
    amount: number;
    description: string;
    status: string;
    payment_type: string;
    createdAt: Date;
  };

  const aprilPayments: PaymentInput[] = [
    // Órdenes históricas — buyer21-30 (2001-2022) — traídas a abril 2026
    {
      order_id: "2001",
      buyer_id: B(21),
      seller_id: S(1),
      buyer_email: buyerEmail(21, "facundo"),
      seller_email: sellerEmail(1),
      buyer_internal_id: 21,
      seller_internal_id: 1,
      amount: 32000,
      description: "Monstera Deliciosa + Mix Semillas",
      status: "approved",
      payment_type: pt(0),
      createdAt: aprilDate(),
    },
    {
      order_id: "2002",
      buyer_id: B(21),
      seller_id: S(4),
      buyer_email: buyerEmail(21, "facundo"),
      seller_email: sellerEmail(4),
      buyer_internal_id: 21,
      seller_internal_id: 4,
      amount: 120000,
      description: "Monstera Thai Constellation",
      status: "approved",
      payment_type: pt(1),
      createdAt: aprilDate(),
    },
    {
      order_id: "2003",
      buyer_id: B(21),
      seller_id: S(11),
      buyer_email: buyerEmail(21, "facundo"),
      seller_email: sellerEmail(11),
      buyer_internal_id: 21,
      seller_internal_id: 11,
      amount: 35000,
      description: "Orquídea Phalaenopsis",
      status: "approved",
      payment_type: pt(2),
      createdAt: aprilDate(),
    },
    {
      order_id: "2004",
      buyer_id: B(22),
      seller_id: S(6),
      buyer_email: buyerEmail(22, "emilia"),
      seller_email: sellerEmail(6),
      buyer_internal_id: 22,
      seller_internal_id: 6,
      amount: 55000,
      description: "Palmera Areca",
      status: "approved",
      payment_type: pt(3),
      createdAt: aprilDate(),
    },
    {
      order_id: "2005",
      buyer_id: B(22),
      seller_id: S(9),
      buyer_email: buyerEmail(22, "emilia"),
      seller_email: sellerEmail(9),
      buyer_internal_id: 22,
      seller_internal_id: 9,
      amount: 57000,
      description: "Loto Sagrado + Kit Terrario",
      status: "approved",
      payment_type: pt(4),
      createdAt: aprilDate(),
    },
    {
      order_id: "2006",
      buyer_id: B(22),
      seller_id: S(13),
      buyer_email: buyerEmail(22, "emilia"),
      seller_email: sellerEmail(13),
      buyer_internal_id: 22,
      seller_internal_id: 13,
      amount: 45000,
      description: "Ficus Lyrata",
      status: "approved",
      payment_type: pt(0),
      createdAt: aprilDate(),
    },
    {
      order_id: "2007",
      buyer_id: B(23),
      seller_id: S(4),
      buyer_email: buyerEmail(23, "benjamin"),
      seller_email: sellerEmail(4),
      buyer_internal_id: 23,
      seller_internal_id: 4,
      amount: 85000,
      description: "Philodendron Pink Princess",
      status: "approved",
      payment_type: pt(1),
      createdAt: aprilDate(),
    },
    {
      order_id: "2008",
      buyer_id: B(23),
      seller_id: S(7),
      buyer_email: buyerEmail(23, "benjamin"),
      seller_email: sellerEmail(7),
      buyer_internal_id: 23,
      seller_internal_id: 7,
      amount: 65000,
      description: "Rosa Roja + Hortensia + Camellia",
      status: "approved",
      payment_type: pt(2),
      createdAt: aprilDate(),
    },
    {
      order_id: "2009",
      buyer_id: B(23),
      seller_id: S(15),
      buyer_email: buyerEmail(23, "benjamin"),
      seller_email: sellerEmail(15),
      buyer_internal_id: 23,
      seller_internal_id: 15,
      amount: 27000,
      description: "Pack Suculentas x3 + Pack Regalo",
      status: "approved",
      payment_type: pt(3),
      createdAt: aprilDate(),
    },
    {
      order_id: "2010",
      buyer_id: B(25),
      seller_id: S(8),
      buyer_email: buyerEmail(25, "santiago"),
      seller_email: sellerEmail(8),
      buyer_internal_id: 25,
      seller_internal_id: 8,
      amount: 75000,
      description: "Bonsai Ficus",
      status: "approved",
      payment_type: pt(4),
      createdAt: aprilDate(),
    },
    {
      order_id: "2011",
      buyer_id: B(25),
      seller_id: S(17),
      buyer_email: buyerEmail(25, "santiago"),
      seller_email: sellerEmail(17),
      buyer_internal_id: 25,
      seller_internal_id: 17,
      amount: 46000,
      description: "Helecho Cuerno de Alce + Nido de Pájaro",
      status: "approved",
      payment_type: pt(0),
      createdAt: aprilDate(),
    },
    {
      order_id: "2012",
      buyer_id: B(25),
      seller_id: S(20),
      buyer_email: buyerEmail(25, "santiago"),
      seller_email: sellerEmail(20),
      buyer_internal_id: 25,
      seller_internal_id: 20,
      amount: 90000,
      description: "Strelitzia Nicolai + Frangipanier",
      status: "approved",
      payment_type: pt(1),
      createdAt: aprilDate(),
    },
    {
      order_id: "2013",
      buyer_id: B(25),
      seller_id: S(16),
      buyer_email: buyerEmail(25, "santiago"),
      seller_email: sellerEmail(16),
      buyer_internal_id: 25,
      seller_internal_id: 16,
      amount: 73000,
      description: "Olivo en Maceta + Lavanda Angustifolia",
      status: "approved",
      payment_type: pt(2),
      createdAt: aprilDate(),
    },
    {
      order_id: "2014",
      buyer_id: B(27),
      seller_id: S(19),
      buyer_email: buyerEmail(27, "maximiliano"),
      seller_email: sellerEmail(19),
      buyer_internal_id: 27,
      seller_internal_id: 19,
      amount: 33000,
      description: "String of Pearls + Hoya Carnosa",
      status: "approved",
      payment_type: pt(3),
      createdAt: aprilDate(),
    },
    {
      order_id: "2015",
      buyer_id: B(27),
      seller_id: S(20),
      buyer_email: buyerEmail(27, "maximiliano"),
      seller_email: sellerEmail(20),
      buyer_internal_id: 27,
      seller_internal_id: 20,
      amount: 90000,
      description: "Strelitzia Nicolai + Frangipanier",
      status: "approved",
      payment_type: pt(4),
      createdAt: aprilDate(),
    },
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // MAYO 2026 — payment_ids 1001-1030 (primera mitad de órdenes recientes)
  // Montos medios/altos, ~8% más que abril
  // ════════════════════════════════════════════════════════════════════════════
  console.log("📅 Creando payments de Mayo...");

  const mayPayments: PaymentInput[] = [
    {
      order_id: "1001",
      buyer_id: B(1),
      seller_id: S(1),
      buyer_email: buyerEmail(1, "buyer"),
      seller_email: sellerEmail(1),
      buyer_internal_id: 1,
      seller_internal_id: 1,
      amount: 44000,
      description: "Monstera Deliciosa + Pilea Peperomioides",
      status: "approved",
      payment_type: pt(0),
      createdAt: mayDate(),
    },
    {
      order_id: "1002",
      buyer_id: B(1),
      seller_id: S(3),
      buyer_email: buyerEmail(1, "buyer"),
      seller_email: sellerEmail(3),
      buyer_internal_id: 1,
      seller_internal_id: 3,
      amount: 27000,
      description: "Aloe Vera + Echeveria Rosa x2 + Crassula",
      status: "approved",
      payment_type: pt(1),
      createdAt: mayDate(),
    },
    {
      order_id: "1003",
      buyer_id: B(1),
      seller_id: S(8),
      buyer_email: buyerEmail(1, "buyer"),
      seller_email: sellerEmail(8),
      buyer_internal_id: 1,
      seller_internal_id: 8,
      amount: 75000,
      description: "Bonsai Ficus",
      status: "approved",
      payment_type: pt(2),
      createdAt: mayDate(),
    },
    {
      order_id: "1004",
      buyer_id: B(2),
      seller_id: S(4),
      buyer_email: buyerEmail(2, "ambos"),
      seller_email: sellerEmail(4),
      buyer_internal_id: 2,
      seller_internal_id: 4,
      amount: 120000,
      description: "Monstera Thai Constellation",
      status: "approved",
      payment_type: pt(3),
      createdAt: mayDate(),
    },
    {
      order_id: "1005",
      buyer_id: B(2),
      seller_id: S(6),
      buyer_email: buyerEmail(2, "ambos"),
      seller_email: sellerEmail(6),
      buyer_internal_id: 2,
      seller_internal_id: 6,
      amount: 55000,
      description: "Palmera Areca",
      status: "approved",
      payment_type: pt(4),
      createdAt: mayDate(),
    },
    {
      order_id: "1006",
      buyer_id: B(6),
      seller_id: S(11),
      buyer_email: buyerEmail(6, "valentina"),
      seller_email: sellerEmail(11),
      buyer_internal_id: 6,
      seller_internal_id: 11,
      amount: 90000,
      description: "Orquídea Phalaenopsis + Orquídea Cattleya",
      status: "approved",
      payment_type: pt(0),
      createdAt: mayDate(),
    },
    {
      order_id: "1007",
      buyer_id: B(6),
      seller_id: S(5),
      buyer_email: buyerEmail(6, "valentina"),
      seller_email: sellerEmail(5),
      buyer_internal_id: 6,
      seller_internal_id: 5,
      amount: 25000,
      description: "Kit Huerta Inicial + Tomate Cherry",
      status: "approved",
      payment_type: pt(1),
      createdAt: mayDate(),
    },
    {
      order_id: "1008",
      buyer_id: B(7),
      seller_id: S(7),
      buyer_email: buyerEmail(7, "ignacio"),
      seller_email: sellerEmail(7),
      buyer_internal_id: 7,
      seller_internal_id: 7,
      amount: 65000,
      description: "Rosa Roja + Hortensia + Camellia",
      status: "approved",
      payment_type: pt(2),
      createdAt: mayDate(),
    },
    {
      order_id: "1009",
      buyer_id: B(7),
      seller_id: S(12),
      buyer_email: buyerEmail(7, "ignacio"),
      seller_email: sellerEmail(12),
      buyer_internal_id: 7,
      seller_internal_id: 12,
      amount: 30000,
      description: "Notro + Calafate",
      status: "approved",
      payment_type: pt(3),
      createdAt: mayDate(),
    },
    {
      order_id: "1010",
      buyer_id: B(8),
      seller_id: S(15),
      buyer_email: buyerEmail(8, "sofia"),
      seller_email: sellerEmail(15),
      buyer_internal_id: 8,
      seller_internal_id: 15,
      amount: 27000,
      description: "Pack Suculentas x3 + Pack Regalo",
      status: "approved",
      payment_type: pt(4),
      createdAt: mayDate(),
    },
    {
      order_id: "1011",
      buyer_id: B(8),
      seller_id: S(10),
      buyer_email: buyerEmail(8, "sofia"),
      seller_email: sellerEmail(10),
      buyer_internal_id: 8,
      seller_internal_id: 10,
      amount: 20000,
      description: "Mix Semillas + Tierra Orgánica + Humus",
      status: "approved",
      payment_type: pt(0),
      createdAt: mayDate(),
    },
    {
      order_id: "1012",
      buyer_id: B(9),
      seller_id: S(9),
      buyer_email: buyerEmail(9, "matias"),
      seller_email: sellerEmail(9),
      buyer_internal_id: 9,
      seller_internal_id: 9,
      amount: 57000,
      description: "Loto Sagrado + Kit Terrario",
      status: "approved",
      payment_type: pt(1),
      createdAt: mayDate(),
    },
    {
      order_id: "1013",
      buyer_id: B(10),
      seller_id: S(4),
      buyer_email: buyerEmail(10, "lucia"),
      seller_email: sellerEmail(4),
      buyer_internal_id: 10,
      seller_internal_id: 4,
      amount: 85000,
      description: "Philodendron Pink Princess",
      status: "approved",
      payment_type: pt(2),
      createdAt: mayDate(),
    },
    {
      order_id: "1014",
      buyer_id: B(10),
      seller_id: S(13),
      buyer_email: buyerEmail(10, "lucia"),
      seller_email: sellerEmail(13),
      buyer_internal_id: 10,
      seller_internal_id: 13,
      amount: 45000,
      description: "Ficus Lyrata",
      status: "approved",
      payment_type: pt(3),
      createdAt: mayDate(),
    },
    {
      order_id: "1015",
      buyer_id: B(10),
      seller_id: S(6),
      buyer_email: buyerEmail(10, "lucia"),
      seller_email: sellerEmail(6),
      buyer_internal_id: 10,
      seller_internal_id: 6,
      amount: 75000,
      description: "Palmera Kentia",
      status: "approved",
      payment_type: pt(4),
      createdAt: mayDate(),
    },
    // Pendientes de mayo (órdenes sin payment_id en el seed del compañero)
    {
      order_id: "pending_mayo_001",
      buyer_id: B(2),
      seller_id: S(1),
      buyer_email: buyerEmail(2, "ambos"),
      seller_email: sellerEmail(1),
      buyer_internal_id: 2,
      seller_internal_id: 1,
      amount: 32000,
      description: "Ficus Elastica",
      status: "pending",
      payment_type: pt(0),
      createdAt: mayDate(),
    },
    {
      order_id: "pending_mayo_002",
      buyer_id: B(8),
      seller_id: S(1),
      buyer_email: buyerEmail(8, "sofia"),
      seller_email: sellerEmail(1),
      buyer_internal_id: 8,
      seller_internal_id: 1,
      amount: 28000,
      description: "Monstera Deliciosa",
      status: "pending",
      payment_type: pt(1),
      createdAt: mayDate(),
    },
    {
      order_id: "pending_mayo_003",
      buyer_id: B(9),
      seller_id: S(3),
      buyer_email: buyerEmail(9, "matias"),
      seller_email: sellerEmail(3),
      buyer_internal_id: 9,
      seller_internal_id: 3,
      amount: 27000,
      description: "Cactus San Pedro + Agave Azul",
      status: "pending",
      payment_type: pt(2),
      createdAt: mayDate(),
    },
    {
      order_id: "pending_mayo_004",
      buyer_id: B(13),
      seller_id: S(15),
      buyer_email: buyerEmail(13, "nicolas"),
      seller_email: sellerEmail(15),
      buyer_internal_id: 13,
      seller_internal_id: 15,
      amount: 18000,
      description: "Pack Regalo Suculentas",
      status: "pending",
      payment_type: pt(3),
      createdAt: mayDate(),
    },
    {
      order_id: "pending_mayo_005",
      buyer_id: B(14),
      seller_id: S(4),
      buyer_email: buyerEmail(14, "martina"),
      seller_email: sellerEmail(4),
      buyer_internal_id: 14,
      seller_internal_id: 4,
      amount: 85000,
      description: "Philodendron Pink Princess",
      status: "pending",
      payment_type: pt(4),
      createdAt: mayDate(),
    },
    // Rechazados de mayo
    {
      order_id: "rejected_mayo_001",
      buyer_id: B(3),
      seller_id: S(2),
      buyer_email: buyerEmail(3, "suspendido"),
      seller_email: sellerEmail(2),
      buyer_internal_id: 3,
      seller_internal_id: 2,
      amount: 18500,
      description: "Lavanda + Romero + Tomillo",
      status: "rejected",
      payment_type: pt(0),
      createdAt: mayDate(),
    },
    {
      order_id: "rejected_mayo_002",
      buyer_id: B(17),
      seller_id: S(3),
      buyer_email: buyerEmail(17, "rodrigo"),
      seller_email: sellerEmail(3),
      buyer_internal_id: 17,
      seller_internal_id: 3,
      amount: 14000,
      description: "Gymnocalycium + Sedum Burro",
      status: "rejected",
      payment_type: pt(1),
      createdAt: mayDate(),
    },
    // Cancelados de mayo
    {
      order_id: "cancelled_mayo_001",
      buyer_id: B(9),
      seller_id: S(6),
      buyer_email: buyerEmail(9, "matias"),
      seller_email: sellerEmail(6),
      buyer_internal_id: 9,
      seller_internal_id: 6,
      amount: 75000,
      description: "Palmera Kentia",
      status: "cancelled",
      payment_type: pt(2),
      createdAt: mayDate(),
    },
    {
      order_id: "cancelled_mayo_002",
      buyer_id: B(12),
      seller_id: S(2),
      buyer_email: buyerEmail(12, "camila"),
      seller_email: sellerEmail(2),
      buyer_internal_id: 12,
      seller_internal_id: 2,
      amount: 11000,
      description: "Menta + Albahaca + Perejil",
      status: "cancelled",
      payment_type: pt(3),
      createdAt: mayDate(),
    },
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // JUNIO 2026 — payment_ids 1016-1045 (segunda mitad de órdenes recientes)
  // Montos más altos, ~8% más que mayo
  // ════════════════════════════════════════════════════════════════════════════
  console.log("📅 Creando payments de Junio...");

  const junePayments: PaymentInput[] = [
    {
      order_id: "1016",
      buyer_id: B(10),
      seller_id: S(18),
      buyer_email: buyerEmail(10, "lucia"),
      seller_email: sellerEmail(18),
      buyer_internal_id: 10,
      seller_internal_id: 18,
      amount: 85000,
      description: "Cactus Totem + Cactus Cereus",
      status: "approved",
      payment_type: pt(0),
      createdAt: juneDate(),
    },
    {
      order_id: "1017",
      buyer_id: B(11),
      seller_id: S(11),
      buyer_email: buyerEmail(11, "tomas"),
      seller_email: sellerEmail(11),
      buyer_internal_id: 11,
      seller_internal_id: 11,
      amount: 90000,
      description: "Orquídea Phalaenopsis + Cattleya",
      status: "approved",
      payment_type: pt(1),
      createdAt: juneDate(),
    },
    {
      order_id: "1018",
      buyer_id: B(12),
      seller_id: S(16),
      buyer_email: buyerEmail(12, "camila"),
      seller_email: sellerEmail(16),
      buyer_internal_id: 12,
      seller_internal_id: 16,
      amount: 73000,
      description: "Olivo en Maceta + Lavanda Angustifolia",
      status: "approved",
      payment_type: pt(2),
      createdAt: juneDate(),
    },
    {
      order_id: "1019",
      buyer_id: B(13),
      seller_id: S(18),
      buyer_email: buyerEmail(13, "nicolas"),
      seller_email: sellerEmail(18),
      buyer_internal_id: 13,
      seller_internal_id: 18,
      amount: 60000,
      description: "Cactus Totem + Cactus Cereus",
      status: "approved",
      payment_type: pt(3),
      createdAt: juneDate(),
    },
    {
      order_id: "1020",
      buyer_id: B(14),
      seller_id: S(20),
      buyer_email: buyerEmail(14, "martina"),
      seller_email: sellerEmail(20),
      buyer_internal_id: 14,
      seller_internal_id: 20,
      amount: 90000,
      description: "Strelitzia Nicolai + Frangipanier",
      status: "approved",
      payment_type: pt(4),
      createdAt: juneDate(),
    },
    {
      order_id: "1021",
      buyer_id: B(14),
      seller_id: S(17),
      buyer_email: buyerEmail(14, "martina"),
      seller_email: sellerEmail(17),
      buyer_internal_id: 14,
      seller_internal_id: 17,
      amount: 46000,
      description: "Helecho Cuerno de Alce + Nido de Pájaro",
      status: "approved",
      payment_type: pt(0),
      createdAt: juneDate(),
    },
    {
      order_id: "1022",
      buyer_id: B(15),
      seller_id: S(6),
      buyer_email: buyerEmail(15, "ezequiel"),
      seller_email: sellerEmail(6),
      buyer_internal_id: 15,
      seller_internal_id: 6,
      amount: 110000,
      description: "Palmera Kentia + Strelitzia",
      status: "approved",
      payment_type: pt(1),
      createdAt: juneDate(),
    },
    {
      order_id: "1023",
      buyer_id: B(15),
      seller_id: S(4),
      buyer_email: buyerEmail(15, "ezequiel"),
      seller_email: sellerEmail(4),
      buyer_internal_id: 15,
      seller_internal_id: 4,
      amount: 65000,
      description: "Anthurium Clarinervium",
      status: "approved",
      payment_type: pt(2),
      createdAt: juneDate(),
    },
    {
      order_id: "1024",
      buyer_id: B(16),
      seller_id: S(11),
      buyer_email: buyerEmail(16, "florencia"),
      seller_email: sellerEmail(11),
      buyer_internal_id: 16,
      seller_internal_id: 11,
      amount: 71000,
      description: "Orquídea Vanda + Fertilizante",
      status: "approved",
      payment_type: pt(3),
      createdAt: juneDate(),
    },
    {
      order_id: "1025",
      buyer_id: B(18),
      seller_id: S(20),
      buyer_email: buyerEmail(18, "agustina"),
      seller_email: sellerEmail(20),
      buyer_internal_id: 18,
      seller_internal_id: 20,
      amount: 40000,
      description: "Heliconia",
      status: "approved",
      payment_type: pt(4),
      createdAt: juneDate(),
    },
    {
      order_id: "1026",
      buyer_id: B(18),
      seller_id: S(9),
      buyer_email: buyerEmail(18, "agustina"),
      seller_email: sellerEmail(9),
      buyer_internal_id: 18,
      seller_internal_id: 9,
      amount: 35000,
      description: "Terrario Vidrio 30cm",
      status: "approved",
      payment_type: pt(0),
      createdAt: juneDate(),
    },
    {
      order_id: "1027",
      buyer_id: B(19),
      seller_id: S(8),
      buyer_email: buyerEmail(19, "leandro"),
      seller_email: sellerEmail(8),
      buyer_internal_id: 19,
      seller_internal_id: 8,
      amount: 108000,
      description: "Bonsai Pino + Maceta Artesanal",
      status: "approved",
      payment_type: pt(1),
      createdAt: juneDate(),
    },
    {
      order_id: "1028",
      buyer_id: B(19),
      seller_id: S(16),
      buyer_email: buyerEmail(19, "leandro"),
      seller_email: sellerEmail(16),
      buyer_internal_id: 19,
      seller_internal_id: 16,
      amount: 65000,
      description: "Olivo en Maceta",
      status: "approved",
      payment_type: pt(2),
      createdAt: juneDate(),
    },
    {
      order_id: "1029",
      buyer_id: B(20),
      seller_id: S(17),
      buyer_email: buyerEmail(20, "julieta"),
      seller_email: sellerEmail(17),
      buyer_internal_id: 20,
      seller_internal_id: 17,
      amount: 50000,
      description: "Phlebodium + Adiantum + Aspidistra",
      status: "approved",
      payment_type: pt(3),
      createdAt: juneDate(),
    },
    {
      order_id: "1030",
      buyer_id: B(20),
      seller_id: S(5),
      buyer_email: buyerEmail(20, "julieta"),
      seller_email: sellerEmail(5),
      buyer_internal_id: 20,
      seller_internal_id: 5,
      amount: 13000,
      description: "Frutilla + Pimiento + Berenjena",
      status: "approved",
      payment_type: pt(4),
      createdAt: juneDate(),
    },
    {
      order_id: "1031",
      buyer_id: B(1),
      seller_id: S(5),
      buyer_email: buyerEmail(1, "buyer"),
      seller_email: sellerEmail(5),
      buyer_internal_id: 1,
      seller_internal_id: 5,
      amount: 30000,
      description: "Kit Huerta + Frutilla + Tomate Cherry",
      status: "approved",
      payment_type: pt(0),
      createdAt: juneDate(),
    },
    {
      order_id: "1032",
      buyer_id: B(2),
      seller_id: S(8),
      buyer_email: buyerEmail(2, "ambos"),
      seller_email: sellerEmail(8),
      buyer_internal_id: 2,
      seller_internal_id: 8,
      amount: 75000,
      description: "Bonsai Ficus",
      status: "approved",
      payment_type: pt(1),
      createdAt: juneDate(),
    },
    {
      order_id: "1033",
      buyer_id: B(4),
      seller_id: S(10),
      buyer_email: buyerEmail(4, "admin"),
      seller_email: sellerEmail(10),
      buyer_internal_id: 4,
      seller_internal_id: 10,
      amount: 20000,
      description: "Mix Semillas + Tierra Orgánica + Humus",
      status: "approved",
      payment_type: pt(2),
      createdAt: juneDate(),
    },
    {
      order_id: "1034",
      buyer_id: B(4),
      seller_id: S(14),
      buyer_email: buyerEmail(4, "admin"),
      seller_email: sellerEmail(14),
      buyer_internal_id: 4,
      seller_internal_id: 14,
      amount: 13000,
      description: "Menta Peperita x2 + Manzanilla",
      status: "approved",
      payment_type: pt(3),
      createdAt: juneDate(),
    },
    {
      order_id: "1035",
      buyer_id: B(6),
      seller_id: S(9),
      buyer_email: buyerEmail(6, "valentina"),
      seller_email: sellerEmail(9),
      buyer_internal_id: 6,
      seller_internal_id: 9,
      amount: 25000,
      description: "Kit Terrario",
      status: "approved",
      payment_type: pt(4),
      createdAt: juneDate(),
    },
    {
      order_id: "1036",
      buyer_id: B(7),
      seller_id: S(20),
      buyer_email: buyerEmail(7, "ignacio"),
      seller_email: sellerEmail(20),
      buyer_internal_id: 7,
      seller_internal_id: 20,
      amount: 55000,
      description: "Strelitzia Nicolai",
      status: "approved",
      payment_type: pt(0),
      createdAt: juneDate(),
    },
    {
      order_id: "1039",
      buyer_id: B(11),
      seller_id: S(8),
      buyer_email: buyerEmail(11, "tomas"),
      seller_email: sellerEmail(8),
      buyer_internal_id: 11,
      seller_internal_id: 8,
      amount: 36000,
      description: "Maceta Artesanal x2",
      status: "approved",
      payment_type: pt(1),
      createdAt: juneDate(),
    },
    {
      order_id: "1040",
      buyer_id: B(12),
      seller_id: S(17),
      buyer_email: buyerEmail(12, "camila"),
      seller_email: sellerEmail(17),
      buyer_internal_id: 12,
      seller_internal_id: 17,
      amount: 28000,
      description: "Helecho Cuerno de Alce",
      status: "approved",
      payment_type: pt(2),
      createdAt: juneDate(),
    },
    {
      order_id: "1041",
      buyer_id: B(13),
      seller_id: S(5),
      buyer_email: buyerEmail(13, "nicolas"),
      seller_email: sellerEmail(5),
      buyer_internal_id: 13,
      seller_internal_id: 5,
      amount: 26000,
      description: "Kit Huerta + Pimiento + Berenjena",
      status: "approved",
      payment_type: pt(3),
      createdAt: juneDate(),
    },
    {
      order_id: "1042",
      buyer_id: B(15),
      seller_id: S(13),
      buyer_email: buyerEmail(15, "ezequiel"),
      seller_email: sellerEmail(13),
      buyer_internal_id: 15,
      seller_internal_id: 13,
      amount: 75000,
      description: "Ficus Lyrata + Alocasia Amazonica",
      status: "approved",
      payment_type: pt(4),
      createdAt: juneDate(),
    },
    {
      order_id: "1043",
      buyer_id: B(16),
      seller_id: S(20),
      buyer_email: buyerEmail(16, "florencia"),
      seller_email: sellerEmail(20),
      buyer_internal_id: 16,
      seller_internal_id: 20,
      amount: 75000,
      description: "Heliconia + Frangipanier",
      status: "approved",
      payment_type: pt(0),
      createdAt: juneDate(),
    },
    {
      order_id: "1044",
      buyer_id: B(18),
      seller_id: S(7),
      buyer_email: buyerEmail(18, "agustina"),
      seller_email: sellerEmail(7),
      buyer_internal_id: 18,
      seller_internal_id: 7,
      amount: 37000,
      description: "Rosa Roja + Hortensia",
      status: "approved",
      payment_type: pt(1),
      createdAt: juneDate(),
    },
    {
      order_id: "1045",
      buyer_id: B(20),
      seller_id: S(3),
      buyer_email: buyerEmail(20, "julieta"),
      seller_email: sellerEmail(3),
      buyer_internal_id: 20,
      seller_internal_id: 3,
      amount: 27000,
      description: "Cactus San Pedro + Agave Azul",
      status: "approved",
      payment_type: pt(2),
      createdAt: juneDate(),
    },
    // Pendientes de junio
    {
      order_id: "pending_junio_001",
      buyer_id: B(16),
      seller_id: S(13),
      buyer_email: buyerEmail(16, "florencia"),
      seller_email: sellerEmail(13),
      buyer_internal_id: 16,
      seller_internal_id: 13,
      amount: 30000,
      description: "Alocasia Amazonica",
      status: "pending",
      payment_type: pt(3),
      createdAt: juneDate(),
    },
    {
      order_id: "pending_junio_002",
      buyer_id: B(19),
      seller_id: S(12),
      buyer_email: buyerEmail(19, "leandro"),
      seller_email: sellerEmail(12),
      buyer_internal_id: 19,
      seller_internal_id: 12,
      amount: 18000,
      description: "Notro",
      status: "pending",
      payment_type: pt(4),
      createdAt: juneDate(),
    },
    {
      order_id: "pending_junio_003",
      buyer_id: B(28),
      seller_id: S(4),
      buyer_email: buyerEmail(28, "antonella"),
      seller_email: sellerEmail(4),
      buyer_internal_id: 28,
      seller_internal_id: 4,
      amount: 120000,
      description: "Monstera Thai Constellation",
      status: "pending",
      payment_type: pt(0),
      createdAt: juneDate(),
    },
    // Rechazados de junio
    {
      order_id: "rejected_junio_001",
      buyer_id: B(3),
      seller_id: S(12),
      buyer_email: buyerEmail(3, "suspendido"),
      seller_email: sellerEmail(12),
      buyer_internal_id: 3,
      seller_internal_id: 12,
      amount: 30000,
      description: "Notro + Calafate",
      status: "rejected",
      payment_type: pt(1),
      createdAt: juneDate(),
    },
    {
      order_id: "rejected_junio_002",
      buyer_id: B(17),
      seller_id: S(14),
      buyer_email: buyerEmail(17, "rodrigo"),
      seller_email: sellerEmail(14),
      buyer_internal_id: 17,
      seller_internal_id: 14,
      amount: 8000,
      description: "Lavanda Angustifolia",
      status: "rejected",
      payment_type: pt(2),
      createdAt: juneDate(),
    },
    // Cancelados de junio
    {
      order_id: "cancelled_junio_001",
      buyer_id: B(24),
      seller_id: S(6),
      buyer_email: buyerEmail(24, "victoria"),
      seller_email: sellerEmail(6),
      buyer_internal_id: 24,
      seller_internal_id: 6,
      amount: 55000,
      description: "Palmera Areca",
      status: "cancelled",
      payment_type: pt(3),
      createdAt: juneDate(),
    },
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // INSERTAR TODOS LOS PAYMENTS Y GENERAR PAYOUTS
  // ════════════════════════════════════════════════════════════════════════════

  const allPayments = [...aprilPayments, ...mayPayments, ...junePayments];

  let approvedCount = 0;
  let payoutAccreditedCount = 0;
  let payoutPendingCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let cancelledCount = 0;

  // Payments aprobados de abril → payout acreditado (ya pasaron ~60 días)
  // Payments aprobados de mayo → payout acreditado (ya pasaron ~30 días)
  // Payments aprobados de junio (1-15) → payout acreditado
  // Payments aprobados de junio (16-25) → payout pending (recientes)

  for (const p of allPayments) {
    const pref = prefId(parseInt(p.order_id) || 0);

    const payment = await prisma.payment.create({
      data: {
        amount: p.amount,
        currency: "ARS",
        status: p.status,
        description: p.description,
        createdAt: p.createdAt,
        order_id: p.order_id,
        buyer_id: p.buyer_id,
        seller_id: p.seller_id,
        buyer_email: p.buyer_email,
        seller_email: p.seller_email,
        payment_type: p.payment_type,
        mp_preference_id: pref,
        mp_init_point: initPoint(pref),
        buyer_internal_id: p.buyer_internal_id,
        seller_internal_id: p.seller_internal_id,
      },
    });

    if (p.status === "approved") {
      approvedCount++;

      // Determinar si el payout ya se acreditó o está pending
      const dayOfMonth = p.createdAt.getDate();
      const month = p.createdAt.getMonth() + 1; // 4=abril, 5=mayo, 6=junio

      const isAccredited = month < 6 || (month === 6 && dayOfMonth <= 15);

      const accreditedAt = isAccredited
        ? payoutDate(p.createdAt, 2 + (approvedCount % 4))
        : null;

      await prisma.payout.create({
        data: {
          amount: parseFloat((p.amount * 0.97).toFixed(2)),
          currency: "ARS",
          status: isAccredited ? "accredited" : "pending",
          payment_id: payment.id,
          seller_id: p.seller_id,
          seller_email: p.seller_email,
          buyer_email: p.buyer_email,
          accreditedAt,
          seller_internal_id: p.seller_internal_id,
        },
      });

      if (isAccredited) payoutAccreditedCount++;
      else payoutPendingCount++;
    } else if (p.status === "pending") pendingCount++;
    else if (p.status === "rejected") rejectedCount++;
    else if (p.status === "cancelled") cancelledCount++;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RESUMEN
  // ════════════════════════════════════════════════════════════════════════════
  const totalPayments = await prisma.payment.count();
  const totalPayouts = await prisma.payout.count();

  console.log("");
  console.log("✅ Seed completado exitosamente");
  console.log("");
  console.log(`📊 Total payments insertados: ${totalPayments}`);
  console.log(`📊 Total payouts insertados:  ${totalPayouts}`);
  console.log("");
  console.log("💳 Distribución de payments:");
  console.log(`   approved  → ${approvedCount}`);
  console.log(`   pending   → ${pendingCount}`);
  console.log(`   rejected  → ${rejectedCount}`);
  console.log(`   cancelled → ${cancelledCount}`);
  console.log("");
  console.log("💸 Distribución de payouts:");
  console.log(
    `   accredited → ${payoutAccreditedCount}  (abril + mayo + junio 1-15)`,
  );
  console.log(
    `   pending    → ${payoutPendingCount}  (junio 16-25, recientes)`,
  );
  console.log("");
  console.log("📅 Cobertura temporal: 1 abril 2026 → 25 junio 2026");
  console.log("");
  console.log("🔗 Alineación con sellers seed:");
  console.log("   order_ids 1001-1045 → órdenes recientes (mayo-junio)");
  console.log("   order_ids 2001-2022 → órdenes históricas (abril)");
  console.log(
    "   buyer_ids  seed_buyer_001-030 ↔ clerk_user_id del buyers seed",
  );
  console.log(
    "   seller_ids seed_seller_001-020 ↔ seller_id integer del sellers seed",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
