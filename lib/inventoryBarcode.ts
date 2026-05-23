import { createId } from "./id";
import type { InventoryItem, ScannedInventoryItem } from "./types";

export function normalizeItemName(name: string): string {
  return name.trim().toLowerCase();
}

export function findMatchingInventoryItem(
  inventory: InventoryItem[],
  scannedName: string
): InventoryItem | undefined {
  const normalized = normalizeItemName(scannedName);
  return inventory.find((item) => normalizeItemName(item.name) === normalized);
}

export type BarcodeScanEvaluation =
  | { action: "duplicate"; existing: InventoryItem; scanned: ScannedInventoryItem }
  | { action: "new"; scanned: ScannedInventoryItem };

/** Evaluate a scan before mutating inventory — drives confirmation UI. */
export function evaluateBarcodeScan(
  inventory: InventoryItem[],
  scannedItem: ScannedInventoryItem
): BarcodeScanEvaluation {
  const existing = findMatchingInventoryItem(inventory, scannedItem.name);
  if (existing) {
    return { action: "duplicate", existing, scanned: scannedItem };
  }
  return { action: "new", scanned: scannedItem };
}

function parseAmount(amount: string): number | null {
  const n = parseFloat(amount.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function canMergeUnits(existingUnit: string, scannedUnit: string): boolean {
  return existingUnit.trim().toLowerCase() === scannedUnit.trim().toLowerCase();
}

/** Merge scanned stock into an existing item (units must match). */
export function mergeScannedIntoExisting(
  existing: InventoryItem,
  scanned: ScannedInventoryItem
): InventoryItem {
  const existingNum = parseAmount(existing.amount);
  const scannedNum = parseAmount(scanned.amount);
  let newAmount = existing.amount;

  if (existingNum !== null && scannedNum !== null) {
    newAmount = String(existingNum + scannedNum);
  }

  const boostedPercent = Math.min(
    100,
    Math.max(existing.percentLeft, scanned.percentLeft) + 15
  );

  return {
    ...existing,
    amount: newAmount,
    percentLeft: boostedPercent,
  };
}

export function createInventoryItemFromScan(
  scanned: ScannedInventoryItem
): InventoryItem {
  return {
    id: createId("inv"),
    name: scanned.name.trim(),
    amount: scanned.amount,
    unit: scanned.unit,
    category: scanned.category,
    percentLeft: scanned.percentLeft,
  };
}

export type AddOrUpdateResult =
  | { type: "needs_confirmation"; evaluation: BarcodeScanEvaluation }
  | { type: "added"; item: InventoryItem; inventory: InventoryItem[] };

/**
 * Entry point for barcode scans. Returns confirmation need for duplicates;
 * otherwise adds a new item immediately.
 */
export function addOrUpdateInventoryItem(
  inventory: InventoryItem[],
  scannedItem: ScannedInventoryItem
): AddOrUpdateResult {
  const evaluation = evaluateBarcodeScan(inventory, scannedItem);

  if (evaluation.action === "duplicate") {
    return { type: "needs_confirmation", evaluation };
  }

  const item = createInventoryItemFromScan(scannedItem);
  return {
    type: "added",
    item,
    inventory: [...inventory, item],
  };
}

export function applyMergeToExisting(
  inventory: InventoryItem[],
  existingId: string,
  scanned: ScannedInventoryItem
): { inventory: InventoryItem[]; warning?: string } {
  const existing = inventory.find((i) => i.id === existingId);
  if (!existing) {
    return { inventory };
  }

  if (!canMergeUnits(existing.unit, scanned.unit)) {
    return {
      inventory,
      warning:
        "Units don't match — create a separate item instead of merging.",
    };
  }

  const merged = mergeScannedIntoExisting(existing, scanned);
  return {
    inventory: inventory.map((i) => (i.id === existingId ? merged : i)),
  };
}

export function applyCreateSeparate(
  inventory: InventoryItem[],
  scanned: ScannedInventoryItem
): InventoryItem[] {
  return [...inventory, createInventoryItemFromScan(scanned)];
}
