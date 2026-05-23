import type { InventoryItem } from "@/lib/types";

interface InventoryPreviewProps {
  items: InventoryItem[];
}

export function InventoryPreview({ items }: InventoryPreviewProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg bg-[#FAF6F0] px-3 py-2.5"
        >
          <div>
            <p className="text-sm font-medium text-[#3D3429]">{item.name}</p>
            <p className="text-xs text-[#8A7B6D]">
              {item.amount} {item.unit} · {item.category}
            </p>
          </div>
          <div className="flex min-w-[72px] flex-col items-end gap-1">
            <span className="text-xs font-medium text-[#8B6F5C]">
              {item.percentLeft}%
            </span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E8DDD0]">
              <div
                className="h-full rounded-full bg-[#E8927C] transition-all"
                style={{ width: `${item.percentLeft}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
