"use client";

import { formatPortionsLeft } from "@/lib/inventoryPortions";
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
  const lowStock = item.portionsLeft <= 2;

  return (
    <div className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[#3D3429]">{item.name}</h3>
          <p className="text-xs text-[#8B6F5C]">{item.category}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            lowStock
              ? "bg-[#F5D9A8]/60 text-[#8B6F5C]"
              : "bg-[#E8F5E9]/80 text-[#5C7A5C]"
          }`}
        >
          {formatPortionsLeft(item.portionsLeft)}
        </span>
      </div>
      <p className="mt-1 text-sm text-[#6B5E52]">
        {item.amount}
        {item.unit ? ` ${item.unit}` : ""}
      </p>
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
