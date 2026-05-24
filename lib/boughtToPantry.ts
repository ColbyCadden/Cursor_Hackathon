import {
  addNewFromShopping,
  applyCreateSeparate,
  applyMergeToExisting,
  evaluateShoppingItemForInventory,
  getBoughtItemsPendingInventory,
  markShoppingItemAdded,
} from "./addBoughtToInventory";
import { syncPantryState } from "./pantrySync";
import type { AppState, InventoryItem, ShoppingListItem } from "./types";

export { getBoughtItemsPendingInventory };

export function addAllBoughtToInventory(state: AppState): AppState {
  const pending = getBoughtItemsPendingInventory(state.shoppingList);
  if (pending.length === 0) return state;

  let inventory = state.inventory;
  let shoppingList = state.shoppingList;

  for (const item of pending) {
    const evaluation = evaluateShoppingItemForInventory(inventory, item);

    if (evaluation.action === "duplicate") {
      const { inventory: merged, warning } = applyMergeToExisting(
        inventory,
        evaluation.existing.id,
        evaluation.scanned
      );
      if (!warning) {
        inventory = merged;
      } else {
        inventory = applyCreateSeparate(inventory, evaluation.scanned);
      }
    } else {
      inventory = addNewFromShopping(inventory, item);
    }

    shoppingList = markShoppingItemAdded(shoppingList, item.id);
  }

  return syncPantryState({ ...state, inventory, shoppingList });
}

export function addSingleBoughtToInventory(
  inventory: InventoryItem[],
  shoppingList: ShoppingListItem[],
  itemId: string
): { inventory: InventoryItem[]; shoppingList: ShoppingListItem[] } {
  const item = shoppingList.find((i) => i.id === itemId);
  if (!item || !item.bought || item.addedToInventory) {
    return { inventory, shoppingList };
  }

  const evaluation = evaluateShoppingItemForInventory(inventory, item);
  let nextInventory = inventory;

  if (evaluation.action === "duplicate") {
    const { inventory: merged, warning } = applyMergeToExisting(
      inventory,
      evaluation.existing.id,
      evaluation.scanned
    );
    nextInventory = warning
      ? applyCreateSeparate(inventory, evaluation.scanned)
      : merged;
  } else {
    nextInventory = addNewFromShopping(inventory, item);
  }

  return {
    inventory: nextInventory,
    shoppingList: markShoppingItemAdded(shoppingList, itemId),
  };
}
