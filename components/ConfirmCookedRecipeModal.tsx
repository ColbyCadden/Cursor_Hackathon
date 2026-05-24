"use client";

import { useEffect, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import {
  getAvailableInInventoryUnits,
  type CookingConfirmRow,
  type UsedIngredientConfirmation,
} from "@/lib/cookingStateActions";
import { SHOPPING_UNITS } from "@/lib/shoppingUnits";
import type { AdaptedRecipe, InventoryItem } from "@/lib/types";

interface ConfirmCookedRecipeModalProps {
  open: boolean;
  recipe: AdaptedRecipe | null;
  inventory: InventoryItem[];
  rows: CookingConfirmRow[];
  onConfirm: (used: UsedIngredientConfirmation[]) => void;
  onCancel: () => void;
}

interface ShortagePrompt {
  rowIndex: number;
  available: number;
  unit: string;
}

export function ConfirmCookedRecipeModal({
  open,
  recipe,
  inventory,
  rows: initialRows,
  onConfirm,
  onCancel,
}: ConfirmCookedRecipeModalProps) {
  const [rows, setRows] = useState<CookingConfirmRow[]>(initialRows);
  const [shortage, setShortage] = useState<ShortagePrompt | null>(null);

  useEffect(() => {
    if (open) setRows(initialRows);
  }, [open, initialRows]);

  if (!open || !recipe) return null;

  const updateRow = (index: number, patch: Partial<CookingConfirmRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const buildConfirmations = (): UsedIngredientConfirmation[] =>
    rows.map((row) => ({
      ingredientId: row.ingredientId,
      inventoryItemId: row.inventoryItemId,
      name: row.name,
      usedAmount: row.usedAmount,
      usedUnit: row.usedUnit,
      subtract: row.subtract,
    }));

  const checkShortage = (): ShortagePrompt | null => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.subtract || !row.inventoryItemId) continue;
      const item = inventory.find((inv) => inv.id === row.inventoryItemId);
      if (!item) continue;
      const available = getAvailableInInventoryUnits(item, row.usedUnit);
      const used = parseFloat(row.usedAmount.replace(/[^\d.]/g, ""));
      if (available !== null && Number.isFinite(used) && used > available) {
        return { rowIndex: i, available, unit: row.usedUnit };
      }
    }
    return null;
  };

  const handleConfirm = () => {
    const prompt = checkShortage();
    if (prompt) {
      setShortage(prompt);
      return;
    }
    onConfirm(buildConfirmations());
  };

  const applyShortageChoice = (choice: "all" | "custom" | "skip") => {
    if (!shortage) return;
    const { rowIndex, available, unit } = shortage;
    if (choice === "all") {
      updateRow(rowIndex, {
        usedAmount: String(available),
        usedUnit: unit,
      });
    } else if (choice === "skip") {
      updateRow(rowIndex, { subtract: false });
    }
    setShortage(null);
  };

  const title = recipe.displayTitle ?? recipe.title;

  return (
    <>
      <div className="fixed inset-0 z-[65] flex items-end justify-center p-4 sm:items-center">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/35"
          onClick={onCancel}
        />
        <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-white p-5 shadow-xl">
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Confirm cooked: {title}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Edit amounts and choose what to subtract from inventory.
          </p>

          {rows.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              No ingredient amounts listed for this recipe. Add ingredients in
              chat or use pantry deductions if shown.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rows.map((row, index) => (
                <li
                  key={row.ingredientId}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--surface)] p-3"
                >
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={row.subtract}
                      disabled={!row.inInventory}
                      onChange={(e) =>
                        updateRow(index, { subtract: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 accent-[var(--salmon)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text)]">
                        {row.name}
                      </p>
                      {!row.inInventory && (
                        <p className="mt-0.5 text-xs text-amber-800">
                          Not in inventory
                        </p>
                      )}
                      {row.inInventory && row.unitMismatch && (
                        <p className="mt-0.5 text-xs text-amber-800">
                          Pantry uses {row.inventoryUnit}, recipe uses{" "}
                          {row.plannedUnit} — enter what you actually used below.
                        </p>
                      )}
                      {row.inInventory && row.autoConvert && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          Using recipe amount ({row.usedAmount} {row.usedUnit})
                          {row.convertedPreview ? ` — ${row.convertedPreview}` : ""}
                        </p>
                      )}
                      {row.inInventory && !row.unitMismatch && !row.autoConvert && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          Inventory: {row.inventoryAmount} {row.inventoryUnit}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        Planned: {row.plannedAmount} {row.plannedUnit}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input
                          value={row.usedAmount}
                          onChange={(e) =>
                            updateRow(index, { usedAmount: e.target.value })
                          }
                          className="rounded-lg border border-[var(--card-border)] px-2 py-1.5 text-xs"
                          placeholder="Amount used"
                        />
                        <select
                          value={row.usedUnit}
                          onChange={(e) =>
                            updateRow(index, { usedUnit: e.target.value })
                          }
                          className="rounded-lg border border-[var(--card-border)] px-2 py-1.5 text-xs"
                        >
                          {[
                            row.plannedUnit,
                            row.inventoryUnit ?? "",
                            ...SHOPPING_UNITS,
                          ]
                            .filter(Boolean)
                            .filter(
                              (u, i, arr) =>
                                arr.findIndex((x) => x === u) === i
                            )
                            .map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={rows.length === 0}
              className="min-h-[44px] flex-1 rounded-xl bg-[var(--salmon)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[var(--salmon-dark)]"
            >
              Confirm and update inventory
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] rounded-xl px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--background)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {shortage && (
        <ConfirmModal
          open
          title="Not enough in inventory"
          primaryLabel={`Use all available (${shortage.available} ${shortage.unit})`}
          secondaryLabel="Skip this ingredient"
          onPrimary={() => applyShortageChoice("all")}
          onSecondary={() => applyShortageChoice("skip")}
          onCancel={() => setShortage(null)}
        >
          <p>
            You only have {shortage.available} {shortage.unit} of{" "}
            <strong>{rows[shortage.rowIndex]?.name}</strong>, but this recipe
            uses {rows[shortage.rowIndex]?.usedAmount}{" "}
            {rows[shortage.rowIndex]?.usedUnit}.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Use all available, skip, or go back and enter a different amount.
          </p>
        </ConfirmModal>
      )}
    </>
  );
}
