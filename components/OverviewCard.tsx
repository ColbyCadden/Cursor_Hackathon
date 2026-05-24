interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: "salmon" | "sage" | "honey" | "sky";
}

const accentStyles = {
  salmon: "bg-[var(--salmon)]/25 border-[var(--salmon)]/40",
  sage: "bg-[var(--green)]/20 border-[var(--green)]/40",
  honey: "bg-[#f5d9a8]/40 border-[#e8c47a]/50",
  sky: "bg-[#b8d4e8]/35 border-[#9bbfd4]/50",
};

export function OverviewCard({
  title,
  value,
  subtitle,
  accent = "salmon",
}: OverviewCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 ${accentStyles[accent]}`}
    >
      <p className="text-sm font-medium text-[var(--text-muted)]">{title}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--text)]">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{subtitle}</p>
      )}
    </div>
  );
}
