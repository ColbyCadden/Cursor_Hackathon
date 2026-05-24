import {
  getMatchTerms,
  scoreIngredientToProduct,
} from "./ingredientAliases";
import type { InventoryItem } from "./types";

export function normalizeIngredientName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MATCH_THRESHOLD = 20;

/** Match a generic meal ingredient to a pantry item (product names may differ). */
export function findInventoryMatch(
  inventory: InventoryItem[],
  ingredientName: string
): InventoryItem | undefined {
  const needle = normalizeIngredientName(ingredientName);
  if (!needle) return undefined;

  let best: { item: InventoryItem; score: number } | undefined;

  for (const item of inventory) {
    const score = scoreIngredientToProduct(
      ingredientName,
      item.name,
      item.ingredientTags
    );
    if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
      best = { item, score };
    }
  }

  return best?.item;
}

export function inventoryHasIngredient(
  inventory: InventoryItem[],
  ingredientName: string
): boolean {
  return findInventoryMatch(inventory, ingredientName) !== undefined;
}

/** Check if two names refer to the same ingredient (for shopping list dedup). */
export function ingredientsMatch(a: string, b: string): boolean {
  return normalizeIngredientName(a) === normalizeIngredientName(b);
}

/** Which saved-meal ingredients does this pantry item satisfy? */
export function findMatchingIngredients(
  inventoryItem: InventoryItem,
  ingredientNames: string[]
): string[] {
  return ingredientNames.filter((name) => {
    const score = scoreIngredientToProduct(
      name,
      inventoryItem.name,
      inventoryItem.ingredientTags
    );
    return score >= MATCH_THRESHOLD;
  });
}

export { getMatchTerms };
