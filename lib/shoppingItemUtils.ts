import {
  categoryToGrocerySection,
  suggestBuyAmounts,
} from "./grocerySections";
import { getDefaultForIngredient } from "./ingredientDefaults";
import type { ShoppingListItem, SuggestedShoppingItem } from "./types";

function resolveUnitNeeded(item: ShoppingListItem): string {
  const raw = item.unitNeeded ?? item.unit ?? "";
  if (raw && raw !== "serving") return raw;
  return getDefaultForIngredient(item.name).unit;
}

export function getAmountNeeded(item: ShoppingListItem): string {
  return item.amountNeeded ?? item.amount ?? "1";
}

export function getUnitNeeded(item: ShoppingListItem): string {
  return resolveUnitNeeded(item);
}

export function getBuyAmount(item: ShoppingListItem): string {
  return item.buyAmount ?? getAmountNeeded(item);
}

export function getBuyUnit(item: ShoppingListItem): string {
  return item.buyUnit ?? getUnitNeeded(item);
}

export function getUsedInRecipes(item: ShoppingListItem): string[] {
  if (item.usedInRecipes?.length) return item.usedInRecipes;
  if (item.reason?.includes("Used in:")) {
    const match = item.reason.match(/Used in:\s*(.+)/i);
    if (match) {
      return match[1].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function isItemInCart(item: ShoppingListItem): boolean {
  return item.inCart === true;
}

export function getCartCount(shoppingList: ShoppingListItem[]): number {
  return shoppingList.filter((i) => i.inCart && !i.addedToInventory).length;
}

export function getNeededCount(shoppingList: ShoppingListItem[]): number {
  return shoppingList.filter((i) => !i.addedToInventory).length;
}

/** Ensure extended fields exist without breaking legacy items. */
export function normalizeShoppingItem(item: ShoppingListItem): ShoppingListItem {
  const amountNeeded = getAmountNeeded(item);
  const unitNeeded = getUnitNeeded(item);
  const grocerySection =
    item.grocerySection ?? categoryToGrocerySection(item.category);
  const buy = suggestBuyAmounts(item.name, amountNeeded, unitNeeded);

  return {
    ...item,
    amount: item.amount ?? amountNeeded,
    unit: item.unit ?? unitNeeded,
    amountNeeded,
    unitNeeded,
    grocerySection,
    buyAmount: item.buyAmount ?? buy.buyAmount,
    buyUnit: item.buyUnit ?? buy.buyUnit,
    equivalentAmount: item.equivalentAmount ?? buy.equivalentAmount,
    equivalentUnit: item.equivalentUnit ?? buy.equivalentUnit,
    usedInRecipes: getUsedInRecipes(item),
    sourceMealIds:
      item.sourceMealIds ??
      (item.sourceMealId ? [item.sourceMealId] : undefined),
    inCart: item.inCart ?? false,
    optional: item.optional ?? !item.required,
    bought: item.bought ?? false,
    addedToInventory: item.addedToInventory ?? false,
    required: item.required ?? true,
    source: item.source ?? "manual",
  };
}

export function createShoppingItemFromSuggested(
  item: SuggestedShoppingItem,
  extras?: Partial<ShoppingListItem>
): ShoppingListItem {
  const amountNeeded = item.amountNeeded ?? item.amount ?? "1";
  const unitNeeded = item.unitNeeded ?? item.unit ?? "";
  const buy = suggestBuyAmounts(item.name, amountNeeded, unitNeeded);
  const usedInRecipes = item.usedInRecipes ?? [];

  return normalizeShoppingItem({
    id: extras?.id ?? "",
    name: item.name,
    amount: amountNeeded,
    unit: unitNeeded,
    amountNeeded,
    unitNeeded,
    buyAmount: item.buyAmount ?? buy.buyAmount,
    buyUnit: item.buyUnit ?? buy.buyUnit,
    equivalentAmount: item.equivalentAmount ?? buy.equivalentAmount,
    equivalentUnit: item.equivalentUnit ?? buy.equivalentUnit,
    category: item.category,
    grocerySection: item.grocerySection ?? categoryToGrocerySection(item.category),
    required: item.required,
    optional: !item.required,
    reason: item.reason,
    usedInRecipes,
    sourceMealIds:
      item.sourceMealIds ??
      (item.sourceMealId ? [item.sourceMealId] : undefined),
    sourceMealId: item.sourceMealId,
    bought: false,
    addedToInventory: false,
    inCart: false,
    source: item.source ?? "ai",
    ...extras,
  });
}

export function mergeUsedInRecipes(
  existing: string[] | undefined,
  incoming: string[] | undefined
): string[] {
  const set = new Set([...(existing ?? []), ...(incoming ?? [])]);
  return Array.from(set);
}
