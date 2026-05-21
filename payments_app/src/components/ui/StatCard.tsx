interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E8E2D6] rounded-xl px-5 py-4 flex flex-col gap-1">
      <span className="text-xs text-[#A67C52]">{label}</span>
      <span className="text-2xl font-bold text-[#243B27]">{value}</span>
      {sub && <span className="text-xs text-[#D9D9D4]">{sub}</span>}
    </div>
  );
}
