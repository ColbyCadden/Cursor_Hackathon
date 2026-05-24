import { createId } from "./id";
import type { ShoppingListItem, SuggestedShoppingItem } from "./types";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function parseAmount(amount: string): number | null {
  const n = parseFloat(amount.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function mergeSuggestedIntoShoppingList(
  shoppingList: ShoppingListItem[],
  suggested: SuggestedShoppingItem[]
): { list: ShoppingListItem[]; added: number; updated: number; skipped: number } {
  let added = 0;
  let updated = 0;
  let skipped = 0;
  const list = [...shoppingList];

  for (const item of suggested) {
    const idx = list.findIndex(
      (existing) => normalizeName(existing.name) === normalizeName(item.name)
    );

    if (idx === -1) {
      list.push({
        id: createId("shop"),
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        category: item.category,
        required: item.required,
        bought: false,
        addedToInventory: false,
        source: "ai",
      });
      added += 1;
      continue;
    }

    const existing = list[idx];
    const existingNum = parseAmount(existing.amount);
    const newNum = parseAmount(item.amount);

    if (
      existingNum !== null &&
      newNum !== null &&
      existing.unit.trim().toLowerCase() === item.unit.trim().toLowerCase()
    ) {
      list[idx] = {
        ...existing,
        amount: String(existingNum + newNum),
      };
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  return { list, added, updated, skipped };
}
