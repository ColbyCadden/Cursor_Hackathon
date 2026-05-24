interface Props {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-6 sm:mb-8">
      <h1 className="text-2xl font-bold text-[var(--text)] md:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-[var(--text-muted)] sm:text-base">{subtitle}</p>
      )}
    </header>
  );
}
