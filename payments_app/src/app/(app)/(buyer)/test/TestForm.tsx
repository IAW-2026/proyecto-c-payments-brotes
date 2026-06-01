"use client";

import { useState, useTransition } from "react";
import { createPaymentAction, PaymentResult } from "./Actions";
type Seller = { id: string; email: string; name: string };
const fields = [
  { label: "Order ID", name: "order_id", type: "text" },
  { label: "Monto", name: "amount", type: "number" },
  { label: "Moneda", name: "currency", type: "text" },
  { label: "Email del comprador", name: "buyer_email", type: "email" },
];
const PRODUCTOS = [
  "Monstera Deliciosa mediana",
  "Kit de herramientas para jardinería indoor",
  "Olivo joven premium para exterior",
  "Pack x3 cactus decorativos",
  "Fertilizante orgánico líquido",
  "Ficus Lyrata grande",
  "Suculentas variadas x5",
  "Maceta de cerámica artesanal",
  "Tierra preparada para interior x5kg",
  "Lavanda en maceta colgante",
  "Pothos dorado enredadera",
  "Sustrato mineral para cactus x3kg",
];
function randomDescription(): string {
  const shuffled = [...PRODUCTOS].sort(() => Math.random() - 0.5);
  const count = Math.floor(Math.random() * 3) + 1; // 1, 2 o 3
  return shuffled.slice(0, count).join(", ");
}
function randomAmount() {
  return String(Math.floor(Math.random() * 90000) + 1000);
}

function generateTestData(buyerEmail: string) {
  return {
    order_id: `order-${Date.now()}`,
    amount: randomAmount(),
    currency: "ARS",
    buyer_email: buyerEmail,
    description: randomDescription(),
  };
}

type FormValues = Record<string, string>;

export function TestForm({
  buyerId,
  buyerEmail,
  sellers,
}: {
  buyerId: string;
  buyerEmail: string;
  sellers: Seller[];
}) {
  const [values, setValues] = useState<FormValues>(() => ({
    ...generateTestData(buyerEmail),
    buyer_id: buyerId,
    seller_id: sellers[0]?.id ?? "",
  }));

  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFill() {
    setValues({
      ...generateTestData(buyerEmail),
      buyer_id: buyerId,
      seller_id: sellers[0]?.id ?? "",
    });
    setResult(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => formData.append(k, v));
    setResult(null);
    setError(null);

    startTransition(async () => {
      const data = await createPaymentAction(formData);
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleFill}
          className="text-xs text-verde-bosque hover:text-verde-profundo hover:bg-verde-brote px-3 py-1.5 rounded-lg transition-colors"
        >
          Rellenar con datos de prueba
        </button>
      </div>
      <div>
        <label htmlFor="seller_id" className="block text-sm font-medium text-verde-profundo mb-1">
          Seller
        </label>
        <select
          id="seller_id"
          name="seller_id"
          value={values.seller_id}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, seller_id: e.target.value }))
          }
          className="w-full px-3 py-2 rounded-lg border border-verde-brote bg-white text-verde-profundo text-sm focus:outline-none focus:ring-2 focus:ring-verde-bosque"
        >
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.email}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="buyer_id" className="block text-sm font-medium text-verde-profundo mb-1">
          Buyer ID
        </label>
        <input
          id="buyer_id"
          type="hidden"
          name="buyer_id"
          value={buyerId}
          disabled
          className="w-full px-3 py-2 rounded-lg border border-verde-brote bg-arena text-verde-profundo/50 text-sm"
        />
      </div>
      {fields.map(({ label, name, type }) => (
        <div key={name}>
          <label htmlFor={name} className="block text-sm font-medium text-verde-profundo mb-1">
            {label}
          </label>
          <input
            id={name}
            type={type}
            name={name}
            value={values[name] ?? ""}
            onChange={handleChange}
            required={name !== "buyer_email"}
            className="w-full px-3 py-2 rounded-lg border border-verde-brote bg-white text-verde-profundo text-sm focus:outline-none focus:ring-2 focus:ring-verde-bosque"
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 px-4 bg-verde-bosque text-white text-sm font-medium rounded-lg hover:bg-verde-profundo transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Creando pago..." : "Crear pago"}
      </button>

      {error && (
        <div className="p-4 rounded-lg bg-arena border border-beige text-terracota text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 rounded-lg bg-verde-suave border border-verde-brote space-y-2">
          <p className="text-sm font-medium text-verde-profundo">Pago creado</p>
          <div className="text-xs text-verde-bosque space-y-1">
            <p>
              <span className="font-medium">ID:</span> {result.payment_id}
            </p>
            <p>
              <span className="font-medium">Order:</span> {result.order_id}
            </p>
            <p>
              <span className="font-medium">Status:</span> {result.status}
            </p>
            <p>
              <span className="font-medium">Monto:</span> {result.amount.value}{" "}
              {result.amount.currency}
            </p>
          </div>
          {result.mp_init_point && (
            <a
              href={result.mp_init_point}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block w-full text-center py-2 px-4 bg-verde-bosque text-white text-sm font-medium rounded-lg hover:bg-verde-profundo transition-colors"
            >
              Pagar con Mercado Pago →
            </a>
          )}
        </div>
      )}
    </form>
  );
}
