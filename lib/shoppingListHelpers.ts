import { createId } from "./id";
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
        {
          id: createId("shop"),
          name: item.name,
          amount: formatAmount(item.amount),
          unit: item.unit,
          category: item.category,
          required: item.required,
          bought: false,
          addedToInventory: false,
          reason: item.reason,
          sourceMealId: item.sourceMealId,
        },
      ],
      added: true,
      updated: false,
      skipped: false,
    };
  }

  const existing = shoppingList[idx];
  const existingNum = parseAmount(existing.amount);
  const newNum = parseAmount(formatAmount(item.amount));

  if (
    existingNum !== null &&
    newNum !== null &&
    existing.unit.trim().toLowerCase() === item.unit.trim().toLowerCase()
  ) {
    const list = [...shoppingList];
    list[idx] = {
      ...existing,
      amount: String(existingNum + newNum),
      reason: item.reason ?? existing.reason,
      sourceMealId: item.sourceMealId ?? existing.sourceMealId,
    };
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
