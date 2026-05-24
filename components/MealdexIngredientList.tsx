"use client";

import { useState } from "react";
import type { MergedMealIngredient } from "@/lib/types";

interface Props {
  items: MergedMealIngredient[];
}

export function MealdexIngredientList({ items }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-[#E8D5C4] bg-[#FFFBF7] px-4 py-6 text-center text-sm text-[#7A7268]">
        Save meals in Discover to auto-fill ingredients here.
      </p>
    );
  }

  const toggle = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
  };

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const key = item.name.toLowerCase();
        const isChecked = checked.has(key);
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => toggle(key)}
              className={`flex w-full items-start gap-3 rounded-xl border border-[#E8D5C4] bg-[#FFFBF7] p-3.5 text-left transition-opacity ${
                isChecked ? "opacity-60" : ""
              }`}
            >
              <span className="mt-0.5 text-xl" aria-hidden>
                {isChecked ? "☑" : "☐"}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-semibold text-[#3D3832] ${isChecked ? "line-through" : ""}`}
                >
                  {item.name}
                  {item.count > 1 ? ` ×${item.count}` : ""}
                </span>
                <span className="mt-0.5 block truncate text-xs text-[#7A7268]">
                  {item.mealNames.join(", ")}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
