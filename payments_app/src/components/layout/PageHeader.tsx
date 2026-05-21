interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-verde-profundo tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-verde-bosque">{subtitle}</p>}
    </div>
  );
}
