"use client";

import { useRef, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { ShoppingItemForm, type ShoppingItemFormData } from "./ShoppingItemForm";
import { ShoppingListGroup } from "./ShoppingListGroup";
import { Toast } from "./Toast";
import {
  addNewFromShopping,
  applyCreateSeparate,
  applyMergeToExisting,
  canMergeUnits,
  evaluateShoppingItemForInventory,
  getBoughtItemsPendingInventory,
  markShoppingItemAdded,
  shoppingItemToScanned,
} from "@/lib/addBoughtToInventory";
import { createId } from "@/lib/id";
import { SHOPPING_CATEGORIES, type InventoryItem, type ShoppingListItem } from "@/lib/types";

interface ShoppingListManagerProps {
  shoppingList: ShoppingListItem[];
  inventory: InventoryItem[];
  onUpdate: (shoppingList: ShoppingListItem[], inventory: InventoryItem[]) => void;
}

export function ShoppingListManager({
  shoppingList,
  inventory,
  onUpdate,
}: ShoppingListManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [unitWarning, setUnitWarning] = useState<string | null>(null);

  const [duplicateModal, setDuplicateModal] = useState<{
    shoppingItem: ShoppingListItem;
    existing: InventoryItem;
  } | null>(null);

  const queueRef = useRef<ShoppingListItem[]>([]);
  const inventoryRef = useRef(inventory);
  const listRef = useRef(shoppingList);

  inventoryRef.current = inventory;
  listRef.current = shoppingList;

  const pendingCount = getBoughtItemsPendingInventory(shoppingList).length;
  const boughtCount = shoppingList.filter((i) => i.bought).length;

  const groups = SHOPPING_CATEGORIES.map((category) => ({
    category,
    items: shoppingList.filter((item) => item.category === category),
  })).filter((g) => g.items.length > 0);

  const showToast = (msg: string) => setToast(msg);

  const updateBoth = (list: ShoppingListItem[], inv: InventoryItem[]) => {
    listRef.current = list;
    inventoryRef.current = inv;
    onUpdate(list, inv);
  };

  const processQueue = () => {
    const next = queueRef.current.shift();
    if (!next) {
      showToast("Bought items added to inventory.");
      return;
    }

    const evaluation = evaluateShoppingItemForInventory(
      inventoryRef.current,
      next
    );

    if (evaluation.action === "duplicate") {
      setDuplicateModal({
        shoppingItem: next,
        existing: evaluation.existing,
      });
      setUnitWarning(null);
      return;
    }

    const newInv = addNewFromShopping(inventoryRef.current, next);
    const newList = markShoppingItemAdded(listRef.current, next.id);
    updateBoth(newList, newInv);
    processQueue();
  };

  const finishCurrentItem = (
    newInv: InventoryItem[],
    itemId: string
  ) => {
    const newList = markShoppingItemAdded(listRef.current, itemId);
    updateBoth(newList, newInv);
    setDuplicateModal(null);
    setUnitWarning(null);
    processQueue();
  };

  const handleAddBoughtToInventory = () => {
    const pending = getBoughtItemsPendingInventory(listRef.current);
    if (!pending.length) {
      showToast("No bought items waiting to be added.");
      return;
    }
    queueRef.current = [...pending];
    processQueue();
  };

  const handleMerge = () => {
    if (!duplicateModal) return;
    const { shoppingItem, existing } = duplicateModal;
    const scanned = shoppingItemToScanned(shoppingItem);

    if (!canMergeUnits(existing.unit, scanned.unit)) {
      setUnitWarning(
        "Units don't match — create a separate item instead of merging."
      );
      return;
    }

    const { inventory: newInv, warning } = applyMergeToExisting(
      inventoryRef.current,
      existing.id,
      scanned
    );
    if (warning) {
      setUnitWarning(warning);
      return;
    }
    finishCurrentItem(newInv, shoppingItem.id);
  };

  const handleSeparate = () => {
    if (!duplicateModal) return;
    const scanned = shoppingItemToScanned(duplicateModal.shoppingItem);
    const newInv = applyCreateSeparate(inventoryRef.current, scanned);
    finishCurrentItem(newInv, duplicateModal.shoppingItem.id);
  };

  const handleDuplicateCancel = () => {
    queueRef.current.shift();
    setDuplicateModal(null);
    setUnitWarning(null);
    if (queueRef.current.length) {
      processQueue();
    }
  };

  const handleToggleBought = (id: string) => {
    onUpdate(
      shoppingList.map((item) =>
        item.id === id ? { ...item, bought: !item.bought } : item
      ),
      inventory
    );
  };

  const handleDelete = (id: string) => {
    onUpdate(
      shoppingList.filter((item) => item.id !== id),
      inventory
    );
  };

  const handleSaveForm = (data: ShoppingItemFormData) => {
    if (editingItem) {
      onUpdate(
        shoppingList.map((item) =>
          item.id === editingItem.id ? { ...item, ...data } : item
        ),
        inventory
      );
    } else {
      onUpdate(
        [
          ...shoppingList,
          {
            id: createId("shop"),
            ...data,
            bought: false,
            addedToInventory: false,
          },
        ],
        inventory
      );
    }
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            + Add item
          </button>
          {boughtCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Remove ${boughtCount} bought item(s) from the list?`
                  )
                ) {
                  onUpdate(
                    shoppingList.filter((i) => !i.bought),
                    inventory
                  );
                  showToast("Bought items cleared.");
                }
              }}
              className="btn-secondary min-h-[44px]"
            >
              Clear bought
            </button>
          )}
          {shoppingList.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Clear the entire shopping list? This cannot be undone."
                  )
                ) {
                  onUpdate([], inventory);
                  showToast("Shopping list cleared.");
                }
              }}
              className="btn-secondary min-h-[44px] text-[var(--salmon-dark)]"
            >
              Clear all
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {shoppingList.length} item(s) · {pendingCount} ready for inventory
        </p>
      </div>

      {showForm && (
        <div className="mb-6">
          <ShoppingItemForm
            title={editingItem ? "Edit item" : "Add item"}
            initial={
              editingItem
                ? {
                    name: editingItem.name,
                    amount: editingItem.amount,
                    unit: editingItem.unit,
                    category: editingItem.category,
                    required: editingItem.required,
                  }
                : undefined
            }
            onSave={handleSaveForm}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {groups.length === 0 ? (
          <div className="empty-state py-10">
            <p className="empty-state-icon" aria-hidden>
              🛍️
            </p>
            <p className="empty-state-title">Shopping list is empty</p>
            <p className="empty-state-text">
              Add items manually or ask the AI meal planner to suggest groceries —
              then tap &quot;Add suggested items to shopping list&quot; in chat.
            </p>
          </div>
        ) : (
          groups.map(({ category, items }) => (
            <ShoppingListGroup
              key={category}
              category={category}
              items={items}
              onToggleBought={handleToggleBought}
              onEdit={(item) => {
                setEditingItem(item);
                setShowForm(true);
              }}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-[var(--card-border)] pt-6 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleAddBoughtToInventory}
          disabled={pendingCount === 0}
          className="btn-green min-h-[48px] w-full sm:w-auto"
        >
          Add bought items to inventory
          {pendingCount > 0 && ` (${pendingCount})`}
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          Check items as bought at the store, then add them to your kitchen
          inventory here.
        </p>
      </div>

      <ConfirmModal
        open={!!duplicateModal}
        title="Item already in inventory"
        primaryLabel="Add to existing item"
        secondaryLabel="Create separate item"
        onPrimary={handleMerge}
        onSecondary={handleSeparate}
        onCancel={handleDuplicateCancel}
      >
        {duplicateModal && (
          <>
            <p>
              <strong>{duplicateModal.existing.name}</strong> already exists.
              Add {duplicateModal.shoppingItem.amount}{" "}
              {duplicateModal.shoppingItem.unit} to the existing item?
            </p>
            <p className="mt-2 text-xs text-[#8A7B6D]">
              Current: {duplicateModal.existing.amount}{" "}
              {duplicateModal.existing.unit} ({duplicateModal.existing.percentLeft}
              % left)
            </p>
            {unitWarning && (
              <p className="mt-2 rounded-lg bg-[#F5D9A8]/50 px-3 py-2 text-xs text-[#8B6F5C]">
                {unitWarning}
              </p>
            )}
          </>
        )}
      </ConfirmModal>
    </>
  );
}
