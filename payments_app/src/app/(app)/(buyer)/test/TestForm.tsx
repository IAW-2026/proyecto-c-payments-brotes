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

function randomAmount() {
  return String(Math.floor(Math.random() * 90000) + 1000);
}

function generateTestData() {
  return {
    order_id: `order-${Date.now()}`,
    amount: randomAmount(),
    currency: "ARS",
    buyer_email: `test_${Math.random().toString(36).slice(2, 7)}@testuser.com`,
  };
}

type FormValues = Record<string, string>;

export function TestForm({
  buyerId,
  sellers,
}: {
  buyerId: string;
  sellers: Seller[];
}) {
  const [values, setValues] = useState<FormValues>(() => ({
    ...generateTestData(),
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
    setValues(generateTestData());
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
        <label className="block text-sm font-medium text-verde-profundo mb-1">
          Seller
        </label>
        <select
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
        <label className="block text-sm font-medium text-verde-profundo mb-1">
          Buyer ID
        </label>
        <input
          type="hidden"
          name="buyer_id"
          value={buyerId}
          disabled
          className="w-full px-3 py-2 rounded-lg border border-verde-brote bg-slate-50 text-verde-profundo/50 text-sm"
        />
      </div>
      {fields.map(({ label, name, type }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-verde-profundo mb-1">
            {label}
          </label>
          <input
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
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
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
