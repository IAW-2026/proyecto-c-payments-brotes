"use client";

import { useState, useEffect, useRef } from "react";

interface PayoutAccreditationStatusProps {
  status: string;
  createdAt: Date | string;
}

export function PayoutAccreditationStatus({
  status,
  createdAt,
}: PayoutAccreditationStatusProps) {
  const durationRef = useRef(Math.floor(Math.random() * 10001) + 30000);

  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const created = new Date(createdAt).getTime();
    const isRecent = Date.now() - created < 60_000;

    if (status === "paid" && isRecent) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), durationRef.current);
      return () => clearTimeout(timer);
    }
  }, [status, createdAt]);

  if (animating) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-verde-brote text-verde-profundo border border-verde-brote">
        <svg
          className="w-3.5 h-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        Acreditando...
      </span>
    );
  }

  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-beige text-verde-profundo border border-gris-piedra">
        <span className="w-1.5 h-1.5 rounded-full bg-verde-profundo" />
        Acreditado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-arena text-marron-tierra border border-beige">
      <span className="w-1.5 h-1.5 rounded-full bg-marron-tierra" />
      Pendiente
    </span>
  );
}
