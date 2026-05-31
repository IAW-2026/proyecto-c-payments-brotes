"use client";
// src/app/(app)/(seller)/error.tsx

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SellerError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[SellerError]", error);
  }, [error]);

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        Algo salió mal
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        No pudimos cargar tus liquidaciones. Puede ser un problema temporal con
        la base de datos.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 transition text-white text-sm font-medium"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
