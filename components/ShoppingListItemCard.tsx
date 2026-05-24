"use client";

import type { ShoppingListItem } from "@/lib/types";

interface ShoppingListItemCardProps {
  item: ShoppingListItem;
  onToggleBought: (id: string) => void;
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
}

export function ShoppingListItemCard({
  item,
  onToggleBought,
  onEdit,
  onDelete,
}: ShoppingListItemCardProps) {
  return (
    <li className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] p-3">
      <div className="flex flex-wrap items-start gap-3">
        <input
          type="checkbox"
          checked={item.bought}
          onChange={() => onToggleBought(item.id)}
          className="mt-1 h-5 w-5 shrink-0 rounded border-[#E8DDD0] accent-[#E8927C]"
          aria-label={`Mark ${item.name} as bought`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium text-[#3D3429] ${
                item.bought ? "line-through opacity-70" : ""
              }`}
            >
              {item.name}
            </span>
            {!item.required && (
              <span className="rounded-full bg-[#F4E8DC] px-2 py-0.5 text-xs text-[#8A7B6D]">
                optional
              </span>
            )}
            {item.addedToInventory && (
              <span className="rounded-full bg-[#E8F5E9]/80 px-2 py-0.5 text-xs text-[#5C7A5C]">
                In pantry
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#8A7B6D]">
            {item.amount} {item.unit}
          </p>
          {item.reason ? (
            <p className="mt-0.5 text-xs italic text-[#8A7B6D]">{item.reason}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 pl-8 sm:pl-8">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="min-h-[36px] rounded-lg border border-[#E8DDD0] px-3 py-1.5 text-xs font-medium text-[#6B5E52] hover:bg-white"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="min-h-[36px] rounded-lg border border-[#E8DDD0] px-3 py-1.5 text-xs font-medium text-[#B85C4A] hover:bg-white"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
