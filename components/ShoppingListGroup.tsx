"use client";

import { ShoppingListItemCard } from "./ShoppingListItemCard";
import type { ShoppingCategory, ShoppingListItem } from "@/lib/types";

interface ShoppingListGroupProps {
  category: ShoppingCategory;
  items: ShoppingListItem[];
  onToggleBought: (id: string) => void;
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
}

export function ShoppingListGroup({
  category,
  items,
  onToggleBought,
  onEdit,
  onDelete,
}: ShoppingListGroupProps) {
  return (
    <section className="rounded-2xl border border-[#E8DDD0] bg-white/80 p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#8B6F5C]">
        {category}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <ShoppingListItemCard
            key={item.id}
            item={item}
            onToggleBought={onToggleBought}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  );
}
