import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  badge,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-[#E8DDD0] bg-white/80 p-6 shadow-sm backdrop-blur-sm ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#3D3429]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-[#8A7B6D]">{description}</p>
          )}
        </div>
        {badge && (
          <span className="rounded-full bg-[#F4E8DC] px-3 py-1 text-xs font-medium text-[#8B6F5C]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
