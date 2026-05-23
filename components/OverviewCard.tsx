interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: "salmon" | "sage" | "honey" | "sky";
}

const accentStyles = {
  salmon: "bg-[#F4A896]/30 border-[#E8927C]/40",
  sage: "bg-[#B8D4B8]/35 border-[#9BBF9B]/50",
  honey: "bg-[#F5D9A8]/40 border-[#E8C47A]/50",
  sky: "bg-[#B8D4E8]/35 border-[#9BBFD4]/50",
};

export function OverviewCard({
  title,
  value,
  subtitle,
  accent = "salmon",
}: OverviewCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${accentStyles[accent]}`}
    >
      <p className="text-sm font-medium text-[#6B5E52]">{title}</p>
      <p className="mt-1 text-2xl font-bold text-[#3D3429]">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-[#8A7B6D]">{subtitle}</p>
      )}
    </div>
  );
}
