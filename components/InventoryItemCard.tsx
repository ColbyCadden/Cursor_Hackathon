"use client";

import type { InventoryItem } from "@/lib/types";

interface InventoryItemCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryItemCard({
  item,
  onEdit,
  onDelete,
}: InventoryItemCardProps) {
  return (
    <div className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[#3D3429]">{item.name}</h3>
          <p className="text-xs text-[#8B6F5C]">{item.category}</p>
        </div>
        <span className="text-sm font-medium text-[#8B6F5C]">
          {item.percentLeft}% left
        </span>
      </div>
      <p className="mt-1 text-sm text-[#6B5E52]">
        {item.amount}
        {item.unit ? ` ${item.unit}` : ""}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8DDD0]">
        <div
          className="h-full rounded-full bg-[#E8927C] transition-all"
          style={{ width: `${item.percentLeft}%` }}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="rounded-lg border border-[#E8DDD0] px-3 py-1.5 text-xs font-medium text-[#6B5E52] hover:bg-white"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-lg border border-[#E8DDD0] px-3 py-1.5 text-xs font-medium text-[#B85C4A] hover:bg-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
