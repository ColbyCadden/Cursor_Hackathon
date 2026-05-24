"use client";

import { useState } from "react";
import { ShoppingListItemCard } from "./ShoppingListItemCard";
import type { GrocerySection, ShoppingListItem } from "@/lib/types";

interface ShoppingListGroupProps {
  section: GrocerySection;
  items: ShoppingListItem[];
  defaultExpanded?: boolean;
  onTapItem: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
}

export function ShoppingListGroup({
  section,
  items,
  defaultExpanded = true,
  onTapItem,
  onDelete,
}: ShoppingListGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const inCartCount = items.filter((i) => i.inCart).length;

  return (
    <section className="rounded-2xl border border-[#E8DDD0] bg-white/80 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-4 text-left sm:px-5"
        aria-expanded={expanded}
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8B6F5C]">
            {section}
          </h2>
          <p className="mt-0.5 text-xs text-[#8A7B6D]">
            {items.length} item{items.length === 1 ? "" : "s"}
            {inCartCount > 0 ? ` · ${inCartCount} in cart` : ""}
          </p>
        </div>
        <span className="text-lg text-[#8A7B6D]" aria-hidden>
          {expanded ? "−" : "+"}
        </span>
      </button>
      {expanded && (
        <ul className="space-y-2 border-t border-[#E8DDD0]/60 px-4 pb-4 pt-3 sm:px-5">
          {items.map((item) => (
            <ShoppingListItemCard
              key={item.id}
              item={item}
              onTap={onTapItem}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
