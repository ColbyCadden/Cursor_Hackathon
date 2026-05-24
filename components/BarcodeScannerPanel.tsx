"use client";

import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import {
  applyCreateSeparate,
  applyMergeToExisting,
  canMergeUnits,
  createInventoryItemFromScan,
  evaluateBarcodeScan,
} from "@/lib/inventoryBarcode";
import { DEFAULT_INVENTORY_PORTIONS, formatPortionsLeft } from "@/lib/inventoryPortions";
import {
  INVENTORY_CATEGORIES,
  type InventoryCategory,
  type InventoryItem,
  type ScannedInventoryItem,
} from "@/lib/types";

const TEST_SCANS: { label: string; item: ScannedInventoryItem }[] = [
  {
    label: "Demo scan: Chicken breast 500g",
    item: {
      name: "Chicken breast",
      amount: "500",
      unit: "g",
      category: "Protein",
      portionsLeft: DEFAULT_INVENTORY_PORTIONS,
    },
  },
  {
    label: "Demo scan: Greek yogurt 750g",
    item: {
      name: "Greek yogurt",
      amount: "750",
      unit: "g",
      category: "Dairy",
      portionsLeft: DEFAULT_INVENTORY_PORTIONS,
    },
  },
  {
    label: "Demo scan: Rice 2 cups",
    item: {
      name: "Rice",
      amount: "2",
      unit: "cups",
      category: "Carbs",
      portionsLeft: DEFAULT_INVENTORY_PORTIONS,
    },
  },
];

interface BarcodeScannerPanelProps {
  inventory: InventoryItem[];
  onInventoryChange: (inventory: InventoryItem[]) => void;
  onToast: (message: string) => void;
}

type ModalState =
  | { type: "duplicate"; existing: InventoryItem; scanned: ScannedInventoryItem }
  | { type: "confirm_new"; scanned: ScannedInventoryItem }
  | null;

export function BarcodeScannerPanel({
  inventory,
  onInventoryChange,
  onToast,
}: BarcodeScannerPanelProps) {
  const [modal, setModal] = useState<ModalState>(null);
  const [editScan, setEditScan] = useState<ScannedInventoryItem | null>(null);
  const [unitWarning, setUnitWarning] = useState<string | null>(null);

  /** Call this from a real barcode scanner with parsed scan data. */
  const handleScan = (scanned: ScannedInventoryItem) => {
    setUnitWarning(null);
    const evaluation = evaluateBarcodeScan(inventory, scanned);

    if (evaluation.action === "duplicate") {
      setModal({
        type: "duplicate",
        existing: evaluation.existing,
        scanned: evaluation.scanned,
      });
      return;
    }

    setEditScan(scanned);
    setModal({ type: "confirm_new", scanned });
  };

  const confirmNewItem = () => {
    if (!editScan) return;
    const item = createInventoryItemFromScan(editScan);
    onInventoryChange([...inventory, item]);
    onToast(`${item.name} added to inventory.`);
    setModal(null);
    setEditScan(null);
  };

  const handleMerge = () => {
    if (modal?.type !== "duplicate") return;
    const { existing, scanned } = modal;

    if (!canMergeUnits(existing.unit, scanned.unit)) {
      setUnitWarning(
        "Units don't match — choose Create separate item or edit units first."
      );
      return;
    }

    const { inventory: next, warning } = applyMergeToExisting(
      inventory,
      existing.id,
      scanned
    );
    if (warning) {
      setUnitWarning(warning);
      return;
    }
    onInventoryChange(next);
    onToast(`Added to existing ${existing.name}.`);
    setModal(null);
    setUnitWarning(null);
  };

  const handleSeparate = () => {
    if (modal?.type !== "duplicate") return;
    const next = applyCreateSeparate(inventory, modal.scanned);
    onInventoryChange(next);
    onToast(`${modal.scanned.name} added as a separate item.`);
    setModal(null);
    setUnitWarning(null);
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--card-border)] bg-[var(--background)] px-6 py-8 text-center">
        <span className="text-4xl" aria-hidden>
          📷
        </span>
        <p className="mt-3 text-sm font-medium text-[var(--text)]">
          Barcode scanner placeholder
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Real scanner integration should call the existing barcode handler with
          scanned item data: name, amount, unit, category, portionsLeft.
        </p>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Demo test scans
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {TEST_SCANS.map(({ label, item }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleScan(item)}
            className="min-h-[44px] rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-2.5 text-left text-sm font-medium text-[var(--text)] transition hover:border-[var(--salmon)] hover:bg-[var(--background)]"
          >
            {label}
          </button>
        ))}
      </div>

      <ConfirmModal
        open={modal?.type === "duplicate"}
        title="Item already in inventory"
        primaryLabel="Add to existing item"
        secondaryLabel="Create separate item"
        onPrimary={handleMerge}
        onSecondary={handleSeparate}
        onCancel={() => {
          setModal(null);
          setUnitWarning(null);
        }}
      >
        {modal?.type === "duplicate" && (
          <>
            <p>
              <strong>{modal.existing.name}</strong> already exists in your
              inventory. Add {modal.scanned.amount} {modal.scanned.unit} to the
              existing item?
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Current: {modal.existing.amount} {modal.existing.unit} (
              {formatPortionsLeft(modal.existing.portionsLeft)})
            </p>
            {unitWarning && (
              <p className="mt-2 rounded-lg bg-[var(--salmon)]/20 px-3 py-2 text-xs text-[var(--text)]">
                {unitWarning}
              </p>
            )}
          </>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={modal?.type === "confirm_new"}
        title="Confirm scanned item"
        primaryLabel="Add to inventory"
        onPrimary={confirmNewItem}
        onCancel={() => {
          setModal(null);
          setEditScan(null);
        }}
      >
        {editScan && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-[var(--text-muted)]">Name</span>
              <input
                value={editScan.name}
                onChange={(e) =>
                  setEditScan({ ...editScan, name: e.target.value })
                }
                className="input-field mt-1"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-medium text-[var(--text-muted)]">Amount</span>
                <input
                  value={editScan.amount}
                  onChange={(e) =>
                    setEditScan({ ...editScan, amount: e.target.value })
                  }
                  className="input-field mt-1"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[var(--text-muted)]">Unit</span>
                <input
                  value={editScan.unit}
                  onChange={(e) =>
                    setEditScan({ ...editScan, unit: e.target.value })
                  }
                  className="input-field mt-1"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-[var(--text-muted)]">Category</span>
              <select
                value={editScan.category}
                onChange={(e) =>
                  setEditScan({
                    ...editScan,
                    category: e.target.value as InventoryCategory,
                  })
                }
                className="input-field mt-1"
              >
                {INVENTORY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Meal portions left
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={editScan.portionsLeft}
                onChange={(e) =>
                  setEditScan({
                    ...editScan,
                    portionsLeft: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="input-field mt-1"
              />
            </label>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
