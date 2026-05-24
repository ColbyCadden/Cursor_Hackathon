import { convertAmount, unitsAreCompatible } from "./cookingConfirm";
import { scoreIngredientToProduct } from "./ingredientAliases";
import {
  addOrUpdateInventoryItem,
  applyCreateSeparate,
  canMergeUnits,
  normalizeItemName,
} from "./inventoryBarcode";
import { normalizeIngredientName } from "./inventoryMatching";
import { syncPantryState } from "./pantrySync";
import { removeShoppingListItemById } from "./shoppingListHelpers";
import {
  getAmountNeeded,
  getUnitNeeded,
  normalizeShoppingItem,
} from "./shoppingItemUtils";
import type { AppState, ScannedInventoryItem, ShoppingListItem } from "./types";

const SIMILAR_MATCH_THRESHOLD = 20;

export type ShoppingListMatchType = "exact" | "similar";

export interface ShoppingListMatch {
  type: ShoppingListMatchType;
  item: ShoppingListItem;
  score?: number;
}

export type ShoppingCoverageResult =
  | { action: "removed"; list: ShoppingListItem[]; message: string }
  | { action: "reduced"; list: ShoppingListItem[]; message: string }
  | {
      action: "needs_confirmation";
      reason: "unit_mismatch" | "amount_unclear";
    };

export type ScannerShoppingSyncResult =
  | { status: "no_match"; state: AppState; messages: string[] }
  | {
      status: "applied";
      state: AppState;
      messages: string[];
      action: "removed" | "reduced";
    }
  | {
      status: "needs_confirmation";
      state: AppState;
      match: ShoppingListMatch;
      scanned: ScannedInventoryItem;
      reason: "similar" | "unit_mismatch" | "amount_unclear";
    };

export type ShoppingListMatchDecision = "remove" | "keep" | "adjust";

function parseAmount(amount: string): number | null {
  const n = parseFloat(String(amount).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatAmount(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function namesMatchExact(a: string, b: string): boolean {
  const na = normalizeItemName(a);
  const nb = normalizeItemName(b);
  if (na === nb) return true;
  if (na.endsWith("s") && na.slice(0, -1) === nb) return true;
  if (nb.endsWith("s") && nb.slice(0, -1) === na) return true;
  return false;
}

function isSimilarName(shoppingName: string, scannedName: string): boolean {
  const na = normalizeIngredientName(shoppingName);
  const nb = normalizeIngredientName(scannedName);
  if (!na || !nb || namesMatchExact(shoppingName, scannedName)) return false;

  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  if (shorter.length >= 4 && longer.includes(shorter)) return true;

  const score = Math.max(
    scoreIngredientToProduct(shoppingName, scannedName),
    scoreIngredientToProduct(scannedName, shoppingName)
  );
  return score >= SIMILAR_MATCH_THRESHOLD;
}

/** Find a shopping list row that matches a scanner item (exact first, then similar). */
export function findMatchingShoppingListItem(
  scanned: ScannedInventoryItem,
  shoppingList: ShoppingListItem[]
): ShoppingListMatch | null {
  const exact = shoppingList.find((item) =>
    namesMatchExact(item.name, scanned.name)
  );
  if (exact) return { type: "exact", item: exact };

  let best: { item: ShoppingListItem; score: number } | undefined;
  for (const item of shoppingList) {
    if (namesMatchExact(item.name, scanned.name)) continue;
    if (!isSimilarName(item.name, scanned.name)) continue;
    const score = Math.max(
      scoreIngredientToProduct(item.name, scanned.name),
      scoreIngredientToProduct(scanned.name, item.name)
    );
    if (!best || score > best.score) {
      best = { item, score };
    }
  }

  if (!best) return null;
  return { type: "similar", item: best.item, score: best.score };
}

export function removeShoppingListItem(
  shoppingList: ShoppingListItem[],
  itemId: string
): ShoppingListItem[] {
  return removeShoppingListItemById(shoppingList, itemId);
}

export function reduceShoppingListItemAmount(
  shoppingList: ShoppingListItem[],
  itemId: string,
  remainingAmount: string,
  remainingUnit: string
): ShoppingListItem[] {
  const remaining = parseAmount(remainingAmount);
  if (remaining === null || remaining <= 0) {
    return removeShoppingListItem(shoppingList, itemId);
  }

  const idx = shoppingList.findIndex((item) => item.id === itemId);
  if (idx === -1) return shoppingList;

  const item = shoppingList[idx];
  const list = [...shoppingList];
  list[idx] = normalizeShoppingItem({
    ...item,
    amount: remainingAmount,
    amountNeeded: remainingAmount,
    unit: remainingUnit,
    unitNeeded: remainingUnit,
    inCart: false,
    bought: false,
    boughtAmount: undefined,
    boughtUnit: undefined,
    boughtEquivalentAmount: undefined,
    boughtEquivalentUnit: undefined,
    addedToInventory: false,
  });
  return list;
}

function convertScannedToNeededUnit(
  scannedAmount: number,
  scannedUnit: string,
  neededUnit: string
): number | null {
  if (canMergeUnits(scannedUnit, neededUnit)) return scannedAmount;
  if (!unitsAreCompatible(scannedUnit, neededUnit)) return null;
  return convertAmount(scannedAmount, scannedUnit, neededUnit);
}

export function getSuggestedRemainingAfterScan(
  item: ShoppingListItem,
  scanned: ScannedInventoryItem
): { amount: string; unit: string } | null {
  const neededNum = parseAmount(getAmountNeeded(item));
  const scannedNum = parseAmount(scanned.amount);
  if (neededNum === null || scannedNum === null) return null;

  const neededUnit = getUnitNeeded(item);
  const converted = convertScannedToNeededUnit(
    scannedNum,
    scanned.unit,
    neededUnit
  );
  if (converted === null) return null;

  const remaining = neededNum - converted;
  if (remaining <= 0) return null;
  return { amount: formatAmount(remaining), unit: neededUnit };
}

function applyCoverageToList(
  shoppingList: ShoppingListItem[],
  item: ShoppingListItem,
  scannedAmount: string,
  scannedUnit: string
): ShoppingCoverageResult {
  const neededNum = parseAmount(getAmountNeeded(item));
  const scannedNum = parseAmount(scannedAmount);
  const neededUnit = getUnitNeeded(item);

  if (neededNum === null || scannedNum === null) {
    return { action: "needs_confirmation", reason: "amount_unclear" };
  }

  const converted = convertScannedToNeededUnit(
    scannedNum,
    scannedUnit,
    neededUnit
  );
  if (converted === null) {
    return { action: "needs_confirmation", reason: "unit_mismatch" };
  }

  if (converted >= neededNum) {
    const list = removeShoppingListItem(shoppingList, item.id);
    return {
      action: "removed",
      list,
      message: `Removed ${item.name} from your shopping list.`,
    };
  }

  const remaining = neededNum - converted;
  const remainingLabel = formatAmount(remaining);
  const list = reduceShoppingListItemAmount(
    shoppingList,
    item.id,
    remainingLabel,
    neededUnit
  );
  return {
    action: "reduced",
    list,
    message: `Updated ${item.name} on your shopping list. Still need ${remainingLabel}${neededUnit}.`,
  };
}

/** Add scanner item to inventory using existing merge/create rules. */
export function addInventoryItemFromScanner(
  state: AppState,
  scanned: ScannedInventoryItem
): AppState {
  let nextInventory = state.inventory;
  const result = addOrUpdateInventoryItem(nextInventory, scanned);
  if (result.type === "added") {
    nextInventory = result.inventory;
  } else {
    nextInventory = applyCreateSeparate(nextInventory, scanned);
  }
  return { ...state, inventory: nextInventory };
}

/** Auto-sync shopping list after a scanner add (exact matches only). */
export function syncScannerItemWithShoppingList(
  state: AppState,
  scanned: ScannedInventoryItem
): ScannerShoppingSyncResult {
  const match = findMatchingShoppingListItem(scanned, state.shoppingList);
  if (!match) {
    return { status: "no_match", state, messages: [] };
  }

  if (match.type === "similar") {
    return {
      status: "needs_confirmation",
      state,
      match,
      scanned,
      reason: "similar",
    };
  }

  const coverage = applyCoverageToList(
    state.shoppingList,
    match.item,
    scanned.amount,
    scanned.unit
  );

  if (coverage.action === "needs_confirmation") {
    return {
      status: "needs_confirmation",
      state,
      match,
      scanned,
      reason: coverage.reason,
    };
  }

  const next = syncPantryState({
    ...state,
    shoppingList: coverage.list,
  });

  return {
    status: "applied",
    state: next,
    messages: [coverage.message],
    action: coverage.action,
  };
}

/** Apply user choice for a similar or uncertain shopping-list match. */
export function confirmShoppingListMatch(
  state: AppState,
  scanned: ScannedInventoryItem,
  shoppingItemId: string,
  decision: ShoppingListMatchDecision,
  adjustRemaining?: { amount: string; unit: string }
): { state: AppState; messages: string[] } {
  const item = state.shoppingList.find((row) => row.id === shoppingItemId);
  if (!item) return { state, messages: [] };

  if (decision === "keep") {
    return { state, messages: [] };
  }

  if (decision === "remove") {
    const next = syncPantryState({
      ...state,
      shoppingList: removeShoppingListItem(state.shoppingList, shoppingItemId),
    });
    return {
      state: next,
      messages: [`Removed ${item.name} from your shopping list.`],
    };
  }

  const suggested = adjustRemaining ?? getSuggestedRemainingAfterScan(item, scanned);
  if (suggested) {
    const remaining = parseAmount(suggested.amount);
    if (remaining !== null && remaining > 0) {
      const list = reduceShoppingListItemAmount(
        state.shoppingList,
        shoppingItemId,
        suggested.amount,
        suggested.unit
      );
      const next = syncPantryState({ ...state, shoppingList: list });
      return {
        state: next,
        messages: [
          `Updated ${item.name} on your shopping list. Still need ${suggested.amount}${suggested.unit}.`,
        ],
      };
    }
  }

  const coverage = applyCoverageToList(
    state.shoppingList,
    item,
    scanned.amount,
    scanned.unit
  );

  if (coverage.action === "needs_confirmation") {
    return { state, messages: [] };
  }

  const next = syncPantryState({
    ...state,
    shoppingList: coverage.list,
  });
  return { state: next, messages: [coverage.message] };
}
