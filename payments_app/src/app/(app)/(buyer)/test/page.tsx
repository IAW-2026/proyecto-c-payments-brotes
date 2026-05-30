import { PageHeader } from "@/components/layout/PageHeader";
import { TestForm } from "./TestForm";

export default function TestPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <PageHeader
        title="Simulador de pago"
        subtitle="Solo para pruebas — no usar en producción"
      />
      <TestForm />
    </main>
  );
}
