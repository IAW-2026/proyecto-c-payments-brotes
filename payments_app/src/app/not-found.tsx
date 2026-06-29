import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-4 bg-arena text-verde-profundo">
      <h1 className="text-6xl font-bold text-verde-bosque">404</h1>
      <p className="text-sm text-marron-tierra">Página no encontrada</p>
      <Link
        href="/"
        className="mt-2 px-4 py-2 rounded-lg bg-verde-bosque text-white text-sm hover:bg-verde-profundo transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
