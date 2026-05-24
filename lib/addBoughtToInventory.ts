import {
  applyCreateSeparate,
  applyMergeToExisting,
  canMergeUnits,
  createInventoryItemFromScan,
  evaluateBarcodeScan,
} from "./inventoryBarcode";
import { DEFAULT_INVENTORY_PORTIONS } from "./inventoryPortions";
import { shoppingCategoryToInventory } from "./shoppingCategories";
import { getBuyAmount, getBuyUnit } from "./shoppingItemUtils";
import type { InventoryItem, ScannedInventoryItem, ShoppingListItem } from "./types";

export function shoppingItemToScanned(item: ShoppingListItem): ScannedInventoryItem {
  const amount =
    item.boughtAmount ?? (item.inCart ? getBuyAmount(item) : item.amount);
  const unit =
    item.boughtUnit ?? (item.inCart ? getBuyUnit(item) : item.unit);
  return {
    name: item.name,
    amount,
    unit,
    category: shoppingCategoryToInventory(item.category),
    portionsLeft: DEFAULT_INVENTORY_PORTIONS,
  };
}

export function getBoughtItemsPendingInventory(
  shoppingList: ShoppingListItem[]
): ShoppingListItem[] {
  return shoppingList.filter((item) => item.bought && !item.addedToInventory);
}

export function markShoppingItemAdded(
  shoppingList: ShoppingListItem[],
  itemId: string
): ShoppingListItem[] {
  return shoppingList.map((item) =>
    item.id === itemId ? { ...item, addedToInventory: true } : item
  );
}

export function addNewFromShopping(
  inventory: InventoryItem[],
  item: ShoppingListItem
): InventoryItem[] {
  const scanned = shoppingItemToScanned(item);
  return [...inventory, createInventoryItemFromScan(scanned)];
}

export function evaluateShoppingItemForInventory(
  inventory: InventoryItem[],
  item: ShoppingListItem
) {
  return evaluateBarcodeScan(inventory, shoppingItemToScanned(item));
}

/** Move a checked-off shopping item into kitchen inventory (merge if name matches). */
export function applyBoughtItemToInventory(
  inventory: InventoryItem[],
  item: ShoppingListItem
): InventoryItem[] {
  if (item.addedToInventory) return inventory;

  const evaluation = evaluateShoppingItemForInventory(inventory, item);

  if (evaluation.action === "duplicate") {
    const { existing, scanned } = evaluation;
    if (canMergeUnits(existing.unit, scanned.unit)) {
      return applyMergeToExisting(inventory, existing.id, scanned).inventory;
    }
    return applyCreateSeparate(inventory, scanned);
  }

  return addNewFromShopping(inventory, item);
}

export function toggleShoppingItemBought(
  shoppingList: ShoppingListItem[],
  inventory: InventoryItem[],
  id: string
): {
  shoppingList: ShoppingListItem[];
  inventory: InventoryItem[];
  toast?: string;
} {
  const item = shoppingList.find((entry) => entry.id === id);
  if (!item) return { shoppingList, inventory };

  const markingBought = !item.bought;
  let nextList = shoppingList.map((entry) =>
    entry.id === id ? { ...entry, bought: markingBought } : entry
  );
  let nextInventory = inventory;
  let toast: string | undefined;

  if (markingBought && !item.addedToInventory) {
    nextInventory = applyBoughtItemToInventory(inventory, item);
    nextList = markShoppingItemAdded(nextList, id);
    toast = `${item.name} added to pantry.`;
  }

  return { shoppingList: nextList, inventory: nextInventory, toast };
}

export { canMergeUnits, applyMergeToExisting, applyCreateSeparate };
