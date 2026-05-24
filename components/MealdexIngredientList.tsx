"use client";

import type { PantryRequirement } from "@/lib/pantrySync";

interface Props {
  items: PantryRequirement[];
}

const STATUS_LABEL: Record<
  PantryRequirement["status"],
  { label: string; className: string }
> = {
  in_stock: {
    label: "In pantry",
    className: "bg-[#E8F5E9] text-[#2E7D32]",
  },
  low: {
    label: "Running low",
    className: "bg-[#FFF3E0] text-[#E65100]",
  },
  missing: {
    label: "Need to buy",
    className: "bg-[#FFEBEE] text-[#C62828]",
  },
};

export function MealdexIngredientList({ items }: Props) {
  if (!items.length) {
    return (
      <p className="empty-state py-6 text-sm text-[var(--text-muted)]">
        Save meals in Mealdex to auto-fill ingredients here.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const key = item.name.toLowerCase();
        const status = STATUS_LABEL[item.status];
        return (
          <li key={key}>
            <div className="flex w-full min-h-[44px] items-start gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-3.5">
              <span className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--text)]">
                    {item.name}
                    {item.mealCount > 1 ? ` ×${item.mealCount}` : ""}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                    {item.percentLeft !== null && item.status !== "missing"
                      ? ` (${item.percentLeft}%)`
                      : ""}
                  </span>
                </div>
                <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                  {item.mealNames.join(", ")}
                </span>
                {item.status !== "in_stock" && (
                  <span className="mt-1 block text-xs text-[var(--text-muted)]">
                    Need ~{item.amountNeeded} {item.unit}
                  </span>
                )}
                {item.status === "in_stock" && item.matchedInventoryId && (
                  <span className="mt-1 block text-xs text-[#2E7D32]">
                    Matched in pantry
                  </span>
                )}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
