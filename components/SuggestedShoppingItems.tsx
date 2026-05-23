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
    <div className="mt-3 rounded-xl border border-[#E8DDD0] bg-white/60 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
        Suggested items
      </p>
      <ul className="space-y-1 text-xs text-[#6B5E52]">
        {items.map((item) => (
          <li key={`${item.name}-${item.amount}`}>
            • {item.name} — {item.amount} {item.unit}
            {!item.required && (
              <span className="text-[#8A7B6D]"> (optional)</span>
            )}
          </li>
        ))}
      </ul>
      {added ? (
        <p className="mt-3 text-xs font-medium text-[#6B8F6B]">
          ✓ Added to shopping list
        </p>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 rounded-lg bg-[#E8927C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#D97F68]"
        >
          Add suggested items to shopping list
        </button>
      )}
    </div>
  );
}
