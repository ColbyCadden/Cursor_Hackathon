"use client";

import { useEffect, useMemo, useState } from "react";
import { formatBuyLabel, formatNeededLabel } from "@/lib/grocerySections";
import {
  getBuyAmount,
  getBuyUnit,
  getAmountNeeded,
  getUnitNeeded,
  getUsedInRecipes,
} from "@/lib/shoppingItemUtils";
import {
  getUnitOptionsForItem,
  resolveDefaultUnit,
  unitInOptions,
} from "@/lib/shoppingUnits";
import type { CartBoughtData, ShoppingListItem } from "@/lib/types";

interface ShoppingCartAmountModalProps {
  item: ShoppingListItem | null;
  open: boolean;
  onConfirm: (data: CartBoughtData) => void;
  onCancel: () => void;
}

export function ShoppingCartAmountModal({
  item,
  open,
  onConfirm,
  onCancel,
}: ShoppingCartAmountModalProps) {
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("count");
  const [eqAmount, setEqAmount] = useState("");
  const [eqUnit, setEqUnit] = useState("g");

  const unitNeeded = item ? getUnitNeeded(item) : "";
  const buyUnit = item ? getBuyUnit(item) : "";
  const unitOptions = useMemo(
    () => (item ? getUnitOptionsForItem(unitNeeded, buyUnit) : []),
    [item, unitNeeded, buyUnit]
  );
  const sameUnitAsNeeded =
    unit.trim().toLowerCase() === unitNeeded.trim().toLowerCase();

  useEffect(() => {
    if (!item) return;
    const needed = getUnitNeeded(item);
    const buy = getBuyUnit(item);
    setAmount(getBuyAmount(item));
    setUnit(resolveDefaultUnit(needed, buy));
    setEqAmount(item.equivalentAmount ?? item.boughtEquivalentAmount ?? "");
    setEqUnit(item.equivalentUnit ?? item.boughtEquivalentUnit ?? "g");
  }, [item]);

  if (!open || !item) return null;

  const usedIn = getUsedInRecipes(item);
  const buyLabel = formatBuyLabel(getBuyAmount(item), getBuyUnit(item));
  const neededLabel = formatNeededLabel(getAmountNeeded(item), unitNeeded);
  const showEquivalent =
    Boolean(item.equivalentAmount) ||
    (buyUnit && buyUnit.toLowerCase() !== unitNeeded.toLowerCase());

  const handleConfirm = () => {
    if (!amount.trim()) return;
    onConfirm({
      boughtAmount: amount.trim(),
      boughtUnit: unit,
      boughtEquivalentAmount:
        showEquivalent && eqAmount.trim() ? eqAmount.trim() : undefined,
      boughtEquivalentUnit:
        showEquivalent && eqAmount.trim() ? eqUnit : undefined,
    });
  };

  const selectValue = unitInOptions(unit, unitOptions) ? unit : unitOptions[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/35"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[#E8DDD0] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#3D3429]">{item.name}</h3>
        <p className="mt-2 text-sm text-[#6B5E52]">
          Suggested: {buyLabel}
          {item.equivalentAmount
            ? ` / about ${item.equivalentAmount}${item.equivalentUnit ? ` ${item.equivalentUnit}` : ""}`
            : ""}
        </p>
        <p className="mt-1 text-sm text-[#8A7B6D]">Needed: {neededLabel}</p>
        {usedIn.length > 0 && (
          <p className="mt-2 text-xs text-[#8A7B6D]">
            Needed for: {usedIn.join(", ")}
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
              Amount
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
              Unit
            </span>
            <select
              value={selectValue}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-3 py-2 text-sm"
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          {showEquivalent && (
            <>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
                  Equivalent amount (optional)
                </span>
                <p className="mb-2 text-[10px] text-[#8A7B6D]">
                  Only if you bought in a different unit than the recipe needs
                  (e.g. 4 breasts ≈ 500g).
                </p>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
                  Equivalent amount
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={eqAmount}
                  onChange={(e) => setEqAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full min-h-[44px] rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[#6B5E52]">
                  Equivalent unit
                </span>
                <select
                  value={eqUnit}
                  onChange={(e) => setEqUnit(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-3 py-2 text-sm"
                >
                  {getUnitOptionsForItem(unitNeeded, "g").map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {sameUnitAsNeeded && !showEquivalent && (
            <p className="sm:col-span-2 text-xs text-[#8A7B6D]">
              Buying in {unitNeeded} — no equivalent amount needed.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleConfirm}
            className="min-h-[44px] flex-1 rounded-xl bg-[#E8927C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D97F68]"
          >
            Add to cart
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-xl px-4 py-2.5 text-sm text-[#8A7B6D] hover:bg-[#FAF6F0]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
