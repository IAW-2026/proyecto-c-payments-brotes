"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BuyerError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[BuyerError]", error);
  }, [error]);

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-semibold text-verde-profundo">
        Algo salió mal
      </h2>
      <p className="text-sm text-marron-tierra max-w-sm">
        No pudimos cargar tus pagos. Puede ser un problema temporal con la base
        de datos.
      </p>
      {error.digest && (
        <p className="text-xs text-gris-piedra font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 rounded-lg bg-verde-profundo hover:bg-verde-oscuro active:scale-95 transition text-white text-sm font-medium"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
