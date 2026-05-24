"use client";

import type { AdaptedRecipe } from "@/lib/types";

interface ChatRecipeCardsProps {
  recipes: AdaptedRecipe[];
}

export function ChatRecipeCards({ recipes }: ChatRecipeCardsProps) {
  if (!recipes.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {recipes.map((recipe) => (
        <div
          key={`${recipe.title}-${recipe.basedOnMealCardId ?? "custom"}`}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--surface)] p-3"
        >
          <p className="text-sm font-semibold text-[var(--text)]">{recipe.title}</p>
          {recipe.tags?.length ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {recipe.tags.join(" · ")}
            </p>
          ) : null}
          {recipe.servings ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Servings: {recipe.servings}
            </p>
          ) : null}
          {recipe.usesInventory?.length ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Uses: {recipe.usesInventory.join(", ")}
            </p>
          ) : null}
          {recipe.missingIngredients?.length ? (
            <p className="mt-1 text-xs text-amber-800">
              Missing: {recipe.missingIngredients.join(", ")}
            </p>
          ) : null}
          {recipe.steps?.length ? (
            <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs text-[var(--text-muted)]">
              {recipe.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
        </div>
      ))}
    </div>
  );
}
