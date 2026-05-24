"use client";

import { useState } from "react";
import { ShoppingItemForm, type ShoppingItemFormData } from "./ShoppingItemForm";
import { ShoppingListGroup } from "./ShoppingListGroup";
import { Toast } from "./Toast";
import { createId } from "@/lib/id";
import { toggleShoppingItemBought } from "@/lib/addBoughtToInventory";
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

  const boughtCount = shoppingList.filter((i) => i.bought).length;

  const groups = SHOPPING_CATEGORIES.map((category) => ({
    category,
    items: shoppingList.filter((item) => item.category === category),
  })).filter((g) => g.items.length > 0);

  const showToast = (msg: string) => setToast(msg);

  const handleToggleBought = (id: string) => {
    const result = toggleShoppingItemBought(shoppingList, inventory, id);
    onUpdate(result.shoppingList, result.inventory);
    if (result.toast) showToast(result.toast);
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
                  onUpdate(shoppingList.filter((i) => !i.bought), inventory);
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
          {shoppingList.length} item(s) · {boughtCount} bought
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
    </>
  );
}
