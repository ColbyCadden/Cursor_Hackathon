import {
  applyCreateSeparate,
  applyMergeToExisting,
  canMergeUnits,
  createInventoryItemFromScan,
  findMatchingInventoryItem,
} from "./inventoryBarcode";
import { findInventoryMatch } from "./inventoryMatching";
import { DEFAULT_INVENTORY_PORTIONS } from "./inventoryPortions";
import { shoppingCategoryToInventory } from "./shoppingCategories";
import { getBuyAmount, getBuyUnit } from "./shoppingItemUtils";
import type {
  AppState,
  InventoryItem,
  ScannedInventoryItem,
  ShoppingListItem,
} from "./types";

export type CartInventoryEvaluation =
  | { type: "exact_merge"; existingId: string; scanned: ScannedInventoryItem }
  | { type: "similar_merge"; existingId: string; existingName: string; scanned: ScannedInventoryItem }
  | { type: "create_new"; scanned: ScannedInventoryItem };

export function cartItemToScanned(item: ShoppingListItem): ScannedInventoryItem {
  const amount = item.boughtAmount ?? getBuyAmount(item);
  const unit = item.boughtUnit ?? getBuyUnit(item);
  return {
    name: item.name,
    amount,
    unit,
    category: shoppingCategoryToInventory(item.category),
    portionsLeft: DEFAULT_INVENTORY_PORTIONS,
  };
}

export function evaluateCartItemForInventory(
  inventory: InventoryItem[],
  item: ShoppingListItem
): CartInventoryEvaluation {
  const scanned = cartItemToScanned(item);
  const exact = findMatchingInventoryItem(inventory, scanned.name);

  if (exact && canMergeUnits(exact.unit, scanned.unit)) {
    return { type: "exact_merge", existingId: exact.id, scanned };
  }

  const similar = findInventoryMatch(inventory, item.name);
  if (similar && similar.id !== exact?.id) {
    return {
      type: "similar_merge",
      existingId: similar.id,
      existingName: similar.name,
      scanned,
    };
  }

  return { type: "create_new", scanned };
}

export function mergeInventoryItem(
  inventory: InventoryItem[],
  existingInventoryItemId: string,
  cartItem: ShoppingListItem
): InventoryItem[] {
  const scanned = cartItemToScanned(cartItem);
  const { inventory: merged, warning } = applyMergeToExisting(
    inventory,
    existingInventoryItemId,
    scanned
  );
  if (warning) {
    return [...inventory, createInventoryItemFromScan(scanned)];
  }
  return merged;
}

export function createInventoryItemFromCart(
  inventory: InventoryItem[],
  cartItem: ShoppingListItem
): InventoryItem[] {
  const scanned = cartItemToScanned(cartItem);
  return [...inventory, createInventoryItemFromScan(scanned)];
}

export interface PendingCartMerge {
  itemId: string;
  cartItemName: string;
  existingId: string;
  existingName: string;
}

export function getCartItems(state: AppState): ShoppingListItem[] {
  return state.shoppingList.filter((i) => i.inCart && !i.addedToInventory);
}

export function addCartToInventory(
  state: AppState,
  mergeDecisions?: Record<string, "merge" | "separate">
): {
  state: AppState;
  addedCount: number;
  pendingMerges: PendingCartMerge[];
} {
  const cartItems = getCartItems(state);
  if (cartItems.length === 0) {
    return { state, addedCount: 0, pendingMerges: [] };
  }

  let inventory = state.inventory;
  const pendingMerges: PendingCartMerge[] = [];
  const processedIds: string[] = [];

  for (const item of cartItems) {
    const decision = mergeDecisions?.[item.id];
    const evaluation = evaluateCartItemForInventory(inventory, item);

    if (evaluation.type === "similar_merge" && !decision) {
      pendingMerges.push({
        itemId: item.id,
        cartItemName: item.name,
        existingId: evaluation.existingId,
        existingName: evaluation.existingName,
      });
      continue;
    }

    if (evaluation.type === "exact_merge" || (evaluation.type === "similar_merge" && decision === "merge")) {
      inventory = mergeInventoryItem(
        inventory,
        evaluation.type === "exact_merge"
          ? evaluation.existingId
          : evaluation.existingId,
        item
      );
    } else {
      inventory = createInventoryItemFromCart(inventory, item);
    }

    processedIds.push(item.id);
  }

  const shoppingList = state.shoppingList.filter(
    (i) => !processedIds.includes(i.id)
  );

  return {
    state: { ...state, inventory, shoppingList },
    addedCount: processedIds.length,
    pendingMerges,
  };
}

export { canMergeUnits, applyMergeToExisting, applyCreateSeparate };
