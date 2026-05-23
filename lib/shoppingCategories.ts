import type { InventoryCategory, ShoppingCategory } from "./types";
import { INVENTORY_CATEGORIES } from "./types";

const VALID = new Set<string>(INVENTORY_CATEGORIES);

export function migrateShoppingCategory(category: string): ShoppingCategory {
  if (VALID.has(category)) return category as ShoppingCategory;
  const map: Record<string, ShoppingCategory> = {
    Produce: "Produce",
    Dairy: "Dairy",
    Other: "Other",
  };
  return map[category] ?? "Other";
}

export function shoppingCategoryToInventory(
  category: ShoppingCategory
): InventoryCategory {
  return category;
}
