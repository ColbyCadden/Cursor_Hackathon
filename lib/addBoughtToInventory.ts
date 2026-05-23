import {
  applyCreateSeparate,
  applyMergeToExisting,
  canMergeUnits,
  createInventoryItemFromScan,
  evaluateBarcodeScan,
} from "./inventoryBarcode";
import { shoppingCategoryToInventory } from "./shoppingCategories";
import type { InventoryItem, ScannedInventoryItem, ShoppingListItem } from "./types";

export function shoppingItemToScanned(item: ShoppingListItem): ScannedInventoryItem {
  return {
    name: item.name,
    amount: item.amount,
    unit: item.unit,
    category: shoppingCategoryToInventory(item.category),
    percentLeft: 100,
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

export { canMergeUnits, applyMergeToExisting, applyCreateSeparate };
