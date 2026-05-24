"use client";

import type { SuggestedShoppingItem } from "@/lib/types";

interface SuggestedShoppingItemsProps {
  items: SuggestedShoppingItem[];
  onAdd: () => void;
  added?: boolean;
}

export function SuggestedShoppingItems({
  items,
  onAdd,
  added,
}: SuggestedShoppingItemsProps) {
  if (!items.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Missing ingredients
      </p>
      <p className="mb-2 text-xs text-[var(--text-muted)]">
        Review these items, then add them to your shopping list when you&apos;re ready.
      </p>
      <ul className="space-y-1 text-xs text-[var(--text)]">
        {items.map((item) => (
          <li key={`${item.name}-${item.amount}`}>
            • {item.name} — {item.amount} {item.unit}
            {!item.required && (
              <span className="text-[var(--text-muted)]"> (optional)</span>
            )}
          </li>
        ))}
      </ul>
      {added ? (
        <p className="mt-3 text-xs font-medium text-[var(--green-dark)]">
          ✓ Added to shopping list
        </p>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="btn-primary mt-3 min-h-[40px] px-4 py-2 text-xs"
        >
          Add to shopping list
        </button>
      )}
    </div>
  );
}
