"use client";

import { ChefHat } from "lucide-react";
import { formatIngredientAmount } from "@/lib/ai/recipeSanitize";
import type { AdaptedRecipe } from "@/lib/types";

interface ChatRecipeCardsProps {
  recipes: AdaptedRecipe[];
  messageId: string;
  cookedRecipeKeys?: string[];
  onConfirmCooked?: (
    messageId: string,
    recipeIndex: number,
    recipe: AdaptedRecipe
  ) => void;
}

export function ChatRecipeCards({
  recipes,
  messageId,
  cookedRecipeKeys = [],
  onConfirmCooked,
}: ChatRecipeCardsProps) {
  if (!recipes.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {recipes.map((recipe, index) => {
        const key = `${messageId}:${index}:${recipe.id ?? recipe.title}`;
        const cooked =
          recipe.cooked || cookedRecipeKeys.includes(key);

        return (
          <div
            key={key}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--surface)] p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--text)]">
                {recipe.displayTitle ?? recipe.title}
              </p>
              {cooked && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
                  Cooked
                </span>
              )}
            </div>
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
            {recipe.ingredients?.length ? (
              <ul className="mt-2 space-y-0.5 text-xs text-[var(--text-muted)]">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id ?? ing.name}>
                    · {ing.name}: {formatIngredientAmount(ing.amount, ing.unit)}
                    {ing.isAvailableInInventory ? " (pantry)" : ""}
                  </li>
                ))}
              </ul>
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
            {onConfirmCooked && !cooked && (
              <button
                type="button"
                onClick={() => onConfirmCooked(messageId, index, recipe)}
                className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--green-dark)]/90 px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--green-dark)]"
              >
                <ChefHat size={16} aria-hidden />
                Confirm cooked
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
