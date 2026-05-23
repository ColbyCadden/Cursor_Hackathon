"use client";

import { useState } from "react";
import { SWIPE_DECK_MEALS } from "@/lib/mealDeckData";
import type { MealCard } from "@/lib/types";

interface MealSwipeDeckProps {
  swipeDeck: MealCard[];
  swipeIndex: number;
  mealLibrary: MealCard[];
  onSwipeIndexChange: (index: number) => void;
  onLibraryChange: (library: MealCard[]) => void;
  onToast: (message: string) => void;
}

export function MealSwipeDeck({
  swipeDeck,
  swipeIndex,
  mealLibrary,
  onSwipeIndexChange,
  onLibraryChange,
  onToast,
}: MealSwipeDeckProps) {
  const [animating, setAnimating] = useState<"save" | "skip" | null>(null);

  const current = swipeDeck[swipeIndex];
  const atEnd = swipeIndex >= swipeDeck.length;

  const advance = () => {
    onSwipeIndexChange(swipeIndex + 1);
    setAnimating(null);
  };

  const handleSave = () => {
    if (!current) return;
    setAnimating("save");

    const alreadySaved = mealLibrary.some((m) => m.id === current.id);
    if (!alreadySaved) {
      onLibraryChange([...mealLibrary, { ...current }]);
    }
    onToast(`${current.name} saved to your library.`);
    setTimeout(advance, 280);
  };

  const handleSkip = () => {
    setAnimating("skip");
    setTimeout(advance, 280);
  };

  const handleRestart = () => {
    onSwipeIndexChange(0);
  };

  if (atEnd) {
    return (
      <div className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-6 py-10 text-center">
        <p className="text-lg font-semibold text-[#3D3429]">
          You&apos;ve reviewed all meal ideas.
        </p>
        <p className="mt-2 text-sm text-[#8A7B6D]">
          {mealLibrary.length} saved in your library. Restart to browse again.
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="mt-6 rounded-xl bg-[#E8927C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D97F68]"
        >
          Restart swipe deck
        </button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div>
      <p className="mb-3 text-xs text-[#8A7B6D]">
        Card {swipeIndex + 1} of {swipeDeck.length}
      </p>
      <div
        className={`rounded-2xl border border-[#E8DDD0] bg-gradient-to-br from-[#FFF8F0] to-[#F9EDE3] p-6 shadow-md transition-all duration-300 ${
          animating === "save"
            ? "translate-x-4 opacity-0"
            : animating === "skip"
              ? "-translate-x-4 opacity-0"
              : ""
        }`}
      >
        <h3 className="text-xl font-bold text-[#3D3429]">{current.name}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {current.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs text-[#6B5E52]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#6B5E52]">
          <span>⏱ {current.estimatedTime}</span>
          <span>· {current.difficulty}</span>
          <span>· {current.nutritionEstimate}</span>
        </div>
        <p className="mt-3 text-sm text-[#8A7B6D]">
          <strong className="text-[#6B5E52]">Ingredients:</strong>{" "}
          {current.mainIngredients.join(", ")}
        </p>
        <p className="mt-1 text-sm text-[#8A7B6D]">
          <strong className="text-[#6B5E52]">Appliance:</strong>{" "}
          {current.requiredAppliance}
        </p>
        <p className="mt-4 text-xs italic text-[#8A7B6D]">
          Meal idea for your future AI planner — not a full recipe.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleSave}
          disabled={!!animating}
          className="flex-1 rounded-xl bg-[#9BBF9B] px-6 py-3 text-sm font-semibold text-[#2D4A2D] hover:bg-[#8AAF8A] disabled:opacity-60"
        >
          ✓ Save
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={!!animating}
          className="flex-1 rounded-xl border border-[#E8DDD0] bg-white px-6 py-3 text-sm font-semibold text-[#6B5E52] hover:bg-[#FAF6F0] disabled:opacity-60"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}

export function resetSwipeDeck(): MealCard[] {
  return SWIPE_DECK_MEALS.map((m) => ({ ...m }));
}
