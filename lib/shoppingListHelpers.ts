import { createId } from "./id";
import {
  createShoppingItemFromSuggested,
  mergeUsedInRecipes,
  normalizeShoppingItem,
} from "./shoppingItemUtils";
import type { ShoppingListItem, SuggestedShoppingItem } from "./types";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function parseAmount(amount: string): number | null {
  const n = parseFloat(amount.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatAmount(value: string | number): string {
  return typeof value === "number" ? String(value) : value;
}

export function mergeSuggestedIntoShoppingList(
  shoppingList: ShoppingListItem[],
  suggested: SuggestedShoppingItem[]
): { list: ShoppingListItem[]; added: number; updated: number; skipped: number } {
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let list = [...shoppingList];

  for (const item of suggested) {
    const result = addSingleToShoppingList(list, item);
    list = result.list;
    if (result.added) added += 1;
    else if (result.updated) updated += 1;
    else if (result.skipped) skipped += 1;
  }

  return { list, added, updated, skipped };
}

export function addSingleToShoppingList(
  shoppingList: ShoppingListItem[],
  item: SuggestedShoppingItem
): { list: ShoppingListItem[]; added: boolean; updated: boolean; skipped: boolean } {
  const idx = shoppingList.findIndex(
    (existing) => normalizeName(existing.name) === normalizeName(item.name)
  );

  if (idx === -1) {
    return {
      list: [
        ...shoppingList,
        createShoppingItemFromSuggested(item, { id: createId("shop"), source: "manual" }),
      ],
      added: true,
      updated: false,
      skipped: false,
    };
  }

  const existing = shoppingList[idx];
  const existingNum = parseAmount(existing.amountNeeded ?? existing.amount);
  const newAmount = item.amountNeeded ?? item.amount;
  const newNum = parseAmount(formatAmount(newAmount));
  const existingUnit = (existing.unitNeeded ?? existing.unit).trim().toLowerCase();
  const newUnit = (item.unitNeeded ?? item.unit).trim().toLowerCase();

  if (
    existingNum !== null &&
    newNum !== null &&
    existingUnit === newUnit
  ) {
    const list = [...shoppingList];
    list[idx] = normalizeShoppingItem({
      ...existing,
      amount: String(existingNum + newNum),
      amountNeeded: String(existingNum + newNum),
      reason: item.reason ?? existing.reason,
      sourceMealId: item.sourceMealId ?? existing.sourceMealId,
      sourceMealIds: mergeUsedInRecipes(
        existing.sourceMealIds,
        item.sourceMealIds ??
          (item.sourceMealId ? [item.sourceMealId] : undefined)
      ),
      usedInRecipes: mergeUsedInRecipes(
        existing.usedInRecipes,
        item.usedInRecipes
      ),
      source: "manual",
    });
    return { list, added: false, updated: true, skipped: false };
  }

  return { list: shoppingList, added: false, updated: false, skipped: true };
}

export function addMultipleToShoppingList(
  shoppingList: ShoppingListItem[],
  items: SuggestedShoppingItem[]
): { list: ShoppingListItem[]; added: number } {
  let list = [...shoppingList];
  let added = 0;
  for (const item of items) {
    const result = addSingleToShoppingList(list, item);
    list = result.list;
    if (result.added) added += 1;
  }
  return { list, added };
}

export function removeShoppingItemByName(
  shoppingList: ShoppingListItem[],
  name: string,
  options?: { optionalOnly?: boolean }
): { list: ShoppingListItem[]; removed: boolean } {
  const target = normalizeName(name);
  const idx = shoppingList.findIndex(
    (item) => normalizeName(item.name) === target
  );
  if (idx === -1) return { list: shoppingList, removed: false };
  const item = shoppingList[idx];
  if (options?.optionalOnly && item.required) {
    return { list: shoppingList, removed: false };
  }
  return {
    list: shoppingList.filter((_, i) => i !== idx),
    removed: true,
  };
}

export function removeShoppingListItemById(
  shoppingList: ShoppingListItem[],
  itemId: string
): ShoppingListItem[] {
  return shoppingList.filter((item) => item.id !== itemId);
}
