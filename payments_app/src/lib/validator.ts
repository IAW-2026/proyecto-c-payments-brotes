import { z } from "zod";
import { PaymentStatus, PayoutStatus } from "@/components/ui/StatusBadge";

// ─── Type guards existentes ───────────────────────────────────────────────────

export function isPaymentStatus(value: string): value is PaymentStatus {
  return ["pending", "approved", "rejected"].includes(value);
}

export function isPayoutStatus(value: string): value is PayoutStatus {
  return ["pending", "paid"].includes(value);
}

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

const VALID_CURRENCIES = ["ARS", "USD", "BRL", "CLP", "COP", "MXN"] as const;

export const CreatePaymentSchema = z.object({
  order_id: z
    .union([z.string(), z.number()])
    .transform(String)
    .pipe(z.string().trim().min(1, "order_id no puede estar vacío.")),

  buyer_id: z
    .union([z.string(), z.number()])
    .transform(String)
    .pipe(z.string().trim().min(1, "buyer_id no puede estar vacío.")),

  seller_id: z
    .union([z.string(), z.number()])
    .transform(String)
    .pipe(z.string().trim().min(1, "seller_id no puede estar vacío.")),

  amount: z
    .number({
      error: "amount debe ser un número.",
    })
    .positive("amount debe ser mayor a 0.")
    .finite("amount debe ser un número finito."),

  // ✅
  currency: z
    .enum(VALID_CURRENCIES, {
      error: `currency debe ser uno de: ${VALID_CURRENCIES.join(", ")}.`,
    })
    .optional()
    .default("ARS"),

  description: z
    .string()
    .trim()
    .max(255, "description no puede superar 255 caracteres.")
    .optional(),

  buyer_email: z
    .string()
    .trim()
    .email("buyer_email debe ser un email válido.")
    .optional()
    .or(z.literal("")),

  buyer_internal_id: z
    .number()
    .int("buyer_internal_id debe ser un entero.")
    .positive("buyer_internal_id debe ser positivo.")
    .optional(),

  seller_internal_id: z
    .number()
    .int("seller_internal_id debe ser un entero.")
    .positive("seller_internal_id debe ser positivo.")
    .optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const SellerIdSchema = z.object({
  sellerId: z
    .string({ error: "sellerId es obligatorio." })
    .trim()
    .min(1, "sellerId no puede estar vacío."),
});

export const PaymentIdSchema = z.object({
  id: z.coerce.number().int().positive("id debe ser un entero positivo."),
});

export const UpdatePaymentStatusSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    error: "status debe ser 'approved' o 'rejected'.",
  }),
});

export const PayoutIdSchema = z.object({
  sellerId: z.coerce.number().int().positive("ID debe ser un entero positivo."),
});

export const UpdatePayoutStatusSchema = z.object({
  status: z.enum(["paid"], {
    error: "status debe ser 'paid'.",
  }),
});
