"use client";

import { useState } from "react";
import { ShoppingItemForm, type ShoppingItemFormData } from "./ShoppingItemForm";
import { ShoppingListGroup } from "./ShoppingListGroup";
import { Toast } from "./Toast";
import { createId } from "@/lib/id";
import { addAllBoughtToInventory } from "@/lib/boughtToPantry";
import { syncPantryState } from "@/lib/pantrySync";
import { SHOPPING_CATEGORIES, type AppState, type ShoppingListItem } from "@/lib/types";

interface ShoppingListManagerProps {
  shoppingList: ShoppingListItem[];
  onUpdate: (shoppingList: ShoppingListItem[]) => void;
  /** When provided, enables bought → pantry flow and auto-sync */
  onPantryUpdate?: (updater: (prev: AppState) => AppState) => void;
  appState?: AppState;
}

export function ShoppingListManager({
  shoppingList,
  onUpdate,
  onPantryUpdate,
  appState,
}: ShoppingListManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const boughtCount = shoppingList.filter((i) => i.bought).length;
  const pendingPantry = shoppingList.filter(
    (i) => i.bought && !i.addedToInventory
  ).length;
  const autoCount = shoppingList.filter(
    (i) => i.source === "mealdex" && !i.bought
  ).length;

  const groups = SHOPPING_CATEGORIES.map((category) => ({
    category,
    items: shoppingList.filter((item) => item.category === category),
  })).filter((g) => g.items.length > 0);

  const showToast = (msg: string) => setToast(msg);

  const handleToggleBought = (id: string) => {
    const nextList = shoppingList.map((item) =>
      item.id === id ? { ...item, bought: !item.bought } : item
    );
    if (onPantryUpdate && appState) {
      onPantryUpdate((prev) =>
        syncPantryState({ ...prev, shoppingList: nextList })
      );
    } else {
      onUpdate(nextList);
    }
  };

  const handleDelete = (id: string) => {
    const nextList = shoppingList.filter((item) => item.id !== id);
    if (onPantryUpdate && appState) {
      onPantryUpdate((prev) =>
        syncPantryState({ ...prev, shoppingList: nextList })
      );
    } else {
      onUpdate(nextList);
    }
  };

  const handleSaveForm = (data: ShoppingItemFormData) => {
    let nextList: ShoppingListItem[];
    if (editingItem) {
      nextList = shoppingList.map((item) =>
        item.id === editingItem.id ? { ...item, ...data } : item
      );
    } else {
      nextList = [
        ...shoppingList,
        {
          id: createId("shop"),
          ...data,
          bought: false,
          addedToInventory: false,
          source: "manual" as const,
        },
      ];
    }

    if (onPantryUpdate && appState) {
      onPantryUpdate((prev) =>
        syncPantryState({ ...prev, shoppingList: nextList })
      );
    } else {
      onUpdate(nextList);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleAddBoughtToPantry = () => {
    if (!onPantryUpdate || !appState || pendingPantry === 0) return;
    onPantryUpdate((prev) => addAllBoughtToInventory(prev));
    showToast(`Added ${pendingPantry} item(s) to your pantry.`);
  };

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
          {pendingPantry > 0 && onPantryUpdate && (
            <button
              type="button"
              onClick={handleAddBoughtToPantry}
              className="btn-secondary min-h-[44px]"
            >
              Add {pendingPantry} bought to pantry
            </button>
          )}
          {boughtCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Remove ${boughtCount} bought item(s) from the list?`
                  )
                ) {
                  const nextList = shoppingList.filter((i) => !i.bought);
                  if (onPantryUpdate && appState) {
                    onPantryUpdate((prev) =>
                      syncPantryState({ ...prev, shoppingList: nextList })
                    );
                  } else {
                    onUpdate(nextList);
                  }
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
                  if (onPantryUpdate && appState) {
                    onPantryUpdate((prev) =>
                      syncPantryState({ ...prev, shoppingList: [] })
                    );
                  } else {
                    onUpdate([]);
                  }
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
          {shoppingList.length} item(s) · {boughtCount} bought
          {autoCount > 0 ? ` · ${autoCount} auto from Mealdex` : ""}
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
              Save meals in Discover and low-stock ingredients appear here
              automatically. You can also add items manually or from AI chat.
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
    </>
  );
}
