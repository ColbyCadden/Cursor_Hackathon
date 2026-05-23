"use client";

import { MealPreviewCard } from "./MealPreviewCard";
import type { MealCard } from "@/lib/types";

interface MealLibraryProps {
  meals: MealCard[];
  onRemove: (id: string) => void;
}

export function MealLibrary({ meals, onRemove }: MealLibraryProps) {
  if (meals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E8DDD0] bg-[#FAF6F0] px-6 py-10 text-center">
        <p className="text-sm text-[#8A7B6D]">
          Save meal ideas from the swipe deck to build your library.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {meals.map((meal) => (
        <div key={meal.id} className="relative">
          <MealPreviewCard meal={meal} compact />
          <button
            type="button"
            onClick={() => onRemove(meal.id)}
            className="mt-2 w-full rounded-lg border border-[#E8DDD0] px-3 py-1.5 text-xs font-medium text-[#B85C4A] hover:bg-[#FAF6F0]"
          >
            Remove from library
          </button>
        </div>
      ))}
    </div>
  );
}
