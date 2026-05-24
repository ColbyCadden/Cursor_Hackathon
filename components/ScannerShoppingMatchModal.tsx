"use client";

import { useEffect, useState } from "react";
import type { ScannedInventoryItem, ShoppingListItem } from "@/lib/types";
import {
  getAmountNeeded,
  getUnitNeeded,
} from "@/lib/shoppingItemUtils";
import { getSuggestedRemainingAfterScan } from "@/lib/scannerShoppingSync";

interface ScannerShoppingMatchModalProps {
  open: boolean;
  scanned: ScannedInventoryItem;
  shoppingItem: ShoppingListItem;
  reason: "similar" | "unit_mismatch" | "amount_unclear";
  onRemove: () => void;
  onKeep: () => void;
  onAdjust: (remaining: { amount: string; unit: string }) => void;
}

export function ScannerShoppingMatchModal({
  open,
  scanned,
  shoppingItem,
  reason,
  onRemove,
  onKeep,
  onAdjust,
}: ScannerShoppingMatchModalProps) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState("");
  const [remainingUnit, setRemainingUnit] = useState("");

  useEffect(() => {
    if (!open) {
      setShowAdjust(false);
      return;
    }
    const suggested = getSuggestedRemainingAfterScan(shoppingItem, scanned);
    setRemainingAmount(suggested?.amount ?? "");
    setRemainingUnit(suggested?.unit ?? getUnitNeeded(shoppingItem));
    setShowAdjust(false);
  }, [open, scanned, shoppingItem]);

  if (!open) return null;

  const neededLabel = `${getAmountNeeded(shoppingItem)} ${getUnitNeeded(shoppingItem)}`;
  const prompt =
    reason === "similar"
      ? `${scanned.name} may match ${shoppingItem.name} on your shopping list (needed ${neededLabel}). Remove or update it?`
      : `${scanned.name} matches ${shoppingItem.name} on your shopping list, but units may not line up. Remove or update it?`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/35"
        onClick={onKeep}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#E8DDD0] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#3D3429]">
          Matches your shopping list
        </h3>
        <p className="mt-3 text-sm text-[#6B5E52]">{prompt}</p>

        {showAdjust && (
          <div className="mt-4 space-y-3 rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] p-3">
            <p className="text-xs font-medium text-[#6B5E52]">Still need</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={remainingAmount}
                onChange={(e) => setRemainingAmount(e.target.value)}
                placeholder="Amount"
                className="min-w-0 flex-1 rounded-lg border border-[#E8DDD0] px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={remainingUnit}
                onChange={(e) => setRemainingUnit(e.target.value)}
                placeholder="Unit"
                className="w-24 rounded-lg border border-[#E8DDD0] px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onAdjust({
                  amount: remainingAmount.trim(),
                  unit: remainingUnit.trim() || getUnitNeeded(shoppingItem),
                })
              }
              className="w-full rounded-xl bg-[#7BAE7F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a9d6e]"
            >
              Save remaining amount
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl bg-[#E8927C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68]"
          >
            Remove from shopping list
          </button>
          {!showAdjust && (
            <button
              type="button"
              onClick={() => {
                const suggested = getSuggestedRemainingAfterScan(
                  shoppingItem,
                  scanned
                );
                if (suggested) {
                  onAdjust(suggested);
                  return;
                }
                setShowAdjust(true);
              }}
              className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-sm font-medium text-[#6B5E52] hover:bg-[#F4E8DC]/60"
            >
              Adjust amount
            </button>
          )}
          <button
            type="button"
            onClick={onKeep}
            className="rounded-xl px-4 py-2.5 text-sm text-[#8A7B6D] hover:bg-[#FAF6F0]"
          >
            Keep on shopping list
          </button>
        </div>
      </div>
    </div>
  );
}
