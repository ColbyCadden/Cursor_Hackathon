"use client";

import { getSavedMeals } from "@/lib/meal/mealHelpers";
import type { AppState } from "@/lib/types";

interface ChatContextSummaryProps {
  appState: AppState;
}

export function ChatContextSummary({ appState }: ChatContextSummaryProps) {
  const savedCount = getSavedMeals(appState).length;
  const goals = appState.profile.eatingGoals?.slice(0, 2).join(" / ") || "student meals";
  const unchecked = appState.shoppingList.filter((i) => !i.bought).length;

  return (
    <div className="mb-4 rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
      <span className="font-semibold text-[var(--text)]">AI is using: </span>
      {appState.inventory.length} pantry item
      {appState.inventory.length === 1 ? "" : "s"}
      {" · "}
      {savedCount} saved meal{savedCount === 1 ? "" : "s"}
      {" · "}
      {goals}
      {" · "}
      {unchecked} shopping item{unchecked === 1 ? "" : "s"}
      {appState.generatedMealPlan?.recipes?.length ? (
        <>
          {" · "}
          active meal plan ({appState.generatedMealPlan.recipes.length} recipe
          {appState.generatedMealPlan.recipes.length === 1 ? "" : "s"})
        </>
      ) : null}
    </div>
  );
}
