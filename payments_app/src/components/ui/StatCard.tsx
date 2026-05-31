interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white border border-beige rounded-xl px-5 py-4 flex flex-col gap-1">
      <span className="text-xs text-marron-tierra">{label}</span>
      <span className="text-2xl font-bold text-verde-profundo">{value}</span>
      {sub && <span className="text-xs text-gris-piedra">{sub}</span>}
    </div>
  );
}
