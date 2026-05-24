import { getDefaultForIngredient } from "./ingredientDefaults";
import { normalizeIngredientName } from "./inventoryMatching";
import type {
  AdaptedRecipe,
  AppState,
  SuggestedShoppingItem,
} from "./types";

function recipeTitle(recipe: AdaptedRecipe): string {
  return recipe.displayTitle ?? recipe.title;
}

/** Build shopping suggestions from recipe missing ingredients (never auto-adds). */
export function suggestedItemsFromRecipes(
  recipes: AdaptedRecipe[]
): SuggestedShoppingItem[] {
  const map = new Map<
    string,
    SuggestedShoppingItem & { usedIn: Set<string>; mealIds: Set<string> }
  >();

  for (const recipe of recipes) {
    const title = recipeTitle(recipe);
    const seenInRecipe = new Set<string>();

    const addName = (rawName: string, amount?: string, unit?: string) => {
      const name = rawName.trim();
      if (!name) return;
      const key = normalizeIngredientName(name);
      if (seenInRecipe.has(key)) return;
      seenInRecipe.add(key);

      const defaults = getDefaultForIngredient(name);
      const existing = map.get(key);
      if (existing) {
        existing.usedIn.add(title);
        if (recipe.basedOnMealCardId) {
          existing.mealIds.add(recipe.basedOnMealCardId);
        }
        return;
      }

      map.set(key, {
        name,
        amount: amount ?? defaults.amount,
        unit: unit ?? defaults.unit,
        amountNeeded: amount ?? defaults.amount,
        unitNeeded: unit ?? defaults.unit,
        category: defaults.category,
        required: true,
        source: "manual",
        usedInRecipes: [title],
        sourceMealId: recipe.basedOnMealCardId,
        sourceMealIds: recipe.basedOnMealCardId
          ? [recipe.basedOnMealCardId]
          : undefined,
        usedIn: new Set([title]),
        mealIds: new Set(recipe.basedOnMealCardId ? [recipe.basedOnMealCardId] : []),
      });
    };

    for (const name of recipe.missingIngredients ?? []) {
      const ing = recipe.ingredients?.find(
        (row) => normalizeIngredientName(row.name) === normalizeIngredientName(name)
      );
      addName(name, ing?.amount, ing?.unit);
    }

    for (const ing of recipe.ingredients ?? []) {
      if (ing.source === "missing" || ing.source === "shopping-list") {
        addName(ing.name, ing.amount, ing.unit);
      }
    }
  }

  return Array.from(map.values()).map(({ usedIn, mealIds, ...item }) => ({
    ...item,
    usedInRecipes: Array.from(usedIn),
    sourceMealIds: mealIds.size ? Array.from(mealIds) : item.sourceMealIds,
    reason:
      item.reason ??
      (usedIn.size
        ? `Used in: ${Array.from(usedIn).join(", ")}`
        : undefined),
  }));
}

export function mergeSuggestedShoppingItems(
  ...lists: (SuggestedShoppingItem[] | undefined)[]
): SuggestedShoppingItem[] {
  const map = new Map<string, SuggestedShoppingItem>();

  for (const list of lists) {
    for (const item of list ?? []) {
      const key = normalizeIngredientName(item.name);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...item });
        continue;
      }

      const usedIn = new Set([
        ...(existing.usedInRecipes ?? []),
        ...(item.usedInRecipes ?? []),
      ]);
      const mealIds = new Set([
        ...(existing.sourceMealIds ?? []),
        ...(item.sourceMealIds ?? []),
        ...(existing.sourceMealId ? [existing.sourceMealId] : []),
        ...(item.sourceMealId ? [item.sourceMealId] : []),
      ]);

      map.set(key, {
        ...existing,
        ...item,
        usedInRecipes: Array.from(usedIn),
        sourceMealIds: mealIds.size ? Array.from(mealIds) : undefined,
        reason:
          item.reason ??
          existing.reason ??
          (usedIn.size
            ? `Used in: ${Array.from(usedIn).join(", ")}`
            : undefined),
      });
    }
  }

  return Array.from(map.values());
}

/** Recipes from the latest assistant message, or the saved meal plan. */
export function collectRecipesFromAppState(state: AppState): AdaptedRecipe[] {
  for (let i = state.chatMessages.length - 1; i >= 0; i--) {
    const msg = state.chatMessages[i];
    if (msg.role === "assistant" && msg.recipes?.length) {
      return msg.recipes;
    }
  }
  return state.generatedMealPlan?.recipes ?? [];
}

export function buildShoppingPromptFromState(state: AppState): {
  suggestedItems: SuggestedShoppingItem[];
  text: string;
} | null {
  const recipes = collectRecipesFromAppState(state);
  const suggestedItems = suggestedItemsFromRecipes(recipes);
  if (!suggestedItems.length) return null;

  return {
    suggestedItems,
    text: `I found ${suggestedItems.length} missing ingredient${suggestedItems.length === 1 ? "" : "s"} from your recent recipes. Review the list below and tap to add them to your shopping list.`,
  };
}
