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
      className={`rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>
        {badge && (
          <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
