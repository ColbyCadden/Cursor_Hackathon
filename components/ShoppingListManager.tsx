"use client";

import { useMemo, useState } from "react";
import { ShoppingCartAmountModal } from "./ShoppingCartAmountModal";
import { ShoppingDeleteModal } from "./ShoppingDeleteModal";
import { ShoppingInventoryMergeModal } from "./ShoppingInventoryMergeModal";
import { ShoppingItemForm, type ShoppingItemFormData } from "./ShoppingItemForm";
import { ShoppingListGroup } from "./ShoppingListGroup";
import { ShoppingSubstituteModal } from "./ShoppingSubstituteModal";
import { Toast } from "./Toast";
import { createId } from "@/lib/id";
import { addCartToInventory, type PendingCartMerge } from "@/lib/cartToInventory";
import { syncPantryState } from "@/lib/pantrySync";
import {
  applyIngredientSubstitution,
  markShoppingItemInCart,
  removeAffectedMealsFromCurrentPlan,
  removeShoppingListItem,
  requestIngredientSubstitutionContext,
  unmarkShoppingItemInCart,
} from "@/lib/shoppingStateActions";
import { getCartCount, getNeededCount, normalizeShoppingItem } from "@/lib/shoppingItemUtils";
import { GROCERY_SECTIONS, type AppState, type ShoppingListItem } from "@/lib/types";

interface ShoppingListManagerProps {
  shoppingList: ShoppingListItem[];
  onUpdate: (shoppingList: ShoppingListItem[]) => void;
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
  const [toast, setToast] = useState<string | null>(null);
  const [amountItem, setAmountItem] = useState<ShoppingListItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ShoppingListItem | null>(null);
  const [substituteContext, setSubstituteContext] = useState<ReturnType<
    typeof requestIngredientSubstitutionContext
  > | null>(null);
  const [pendingMerge, setPendingMerge] = useState<PendingCartMerge | null>(null);
  const [mergeDecisions, setMergeDecisions] = useState<
    Record<string, "merge" | "separate">
  >({});

  const normalizedList = useMemo(
    () => shoppingList.map((item) => normalizeShoppingItem(item)),
    [shoppingList]
  );

  const neededCount = getNeededCount(normalizedList);
  const cartCount = getCartCount(normalizedList);

  const groups = GROCERY_SECTIONS.map((section) => ({
    section,
    items: normalizedList.filter(
      (item) => (item.grocerySection ?? "Other") === section
    ),
  })).filter((g) => g.items.length > 0);

  const sectionCount = groups.length;

  const showToast = (msg: string) => setToast(msg);

  const applyState = (updater: (prev: AppState) => AppState, toastMessage?: string) => {
    if (onPantryUpdate && appState) {
      onPantryUpdate(updater);
    } else {
      const next = updater(appState ?? ({} as AppState));
      onUpdate(next.shoppingList);
    }
    if (toastMessage) showToast(toastMessage);
  };

  const handleTapItem = (item: ShoppingListItem) => {
    if (item.inCart) {
      applyState((prev) => unmarkShoppingItemInCart(prev, item.id));
      return;
    }
    setAmountItem(item);
  };

  const handleConfirmCart = (data: {
    boughtAmount: string;
    boughtUnit: string;
    boughtEquivalentAmount?: string;
    boughtEquivalentUnit?: string;
  }) => {
    if (!amountItem) return;
    applyState(
      (prev) => markShoppingItemInCart(prev, amountItem.id, data),
      `${amountItem.name} added to cart.`
    );
    setAmountItem(null);
  };

  const handleAddCartToInventory = () => {
    if (cartCount === 0 || !onPantryUpdate) return;

    onPantryUpdate((prev) => {
      const result = addCartToInventory(prev, mergeDecisions);

      if (result.pendingMerges.length > 0) {
        setPendingMerge(result.pendingMerges[0]);
        return syncPantryState(result.state);
      }

      if (result.addedCount > 0) {
        showToast(
          `Added ${result.addedCount} item${result.addedCount === 1 ? "" : "s"} to inventory.`
        );
      }
      setMergeDecisions({});
      return syncPantryState(result.state);
    });
  };

  const handleMergeDecision = (decision: "merge" | "separate") => {
    if (!pendingMerge || !onPantryUpdate) return;

    const itemId = pendingMerge.itemId;
    const nextDecisions = { ...mergeDecisions, [itemId]: decision };

    onPantryUpdate((prev) => {
      const result = addCartToInventory(prev, nextDecisions);
      const remaining = result.pendingMerges.filter((m) => m.itemId !== itemId);

      setMergeDecisions(nextDecisions);
      setPendingMerge(remaining[0] ?? null);

      if (remaining.length === 0 && result.addedCount > 0) {
        showToast(
          `Added ${result.addedCount} item${result.addedCount === 1 ? "" : "s"} to inventory.`
        );
        setMergeDecisions({});
      }

      return syncPantryState(result.state);
    });
  };

  const handleDeleteRequest = (id: string) => {
    const item = normalizedList.find((i) => i.id === id);
    if (!item) return;
    setDeleteItem(item);
  };

  const handleDeleteSubstitute = () => {
    if (!deleteItem || !appState) return;
    const ctx = requestIngredientSubstitutionContext(appState, deleteItem.id);
    setSubstituteContext(ctx);
    setDeleteItem(null);
  };

  const handleSubstituteSelect = (substitute: string) => {
    if (!substituteContext) return;
    applyState(
      (prev) =>
        applyIngredientSubstitution(prev, substituteContext.item.id, substitute),
      `Substituted ${substitute} for ${substituteContext.item.name}.`
    );
    setSubstituteContext(null);
  };

  const handleSaveForm = (data: ShoppingItemFormData) => {
    const nextItem = normalizeShoppingItem({
      id: createId("shop"),
      name: data.name,
      amount: data.amount,
      unit: data.unit,
      amountNeeded: data.amount,
      unitNeeded: data.unit,
      category: data.category,
      required: data.required,
      bought: false,
      addedToInventory: false,
      inCart: false,
      source: "manual",
    });

    const nextList = [...shoppingList, nextItem];
    applyState((prev) => syncPantryState({ ...prev, shoppingList: nextList }));
    setShowForm(false);
  };

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mb-4 rounded-xl border-2 border-[#E8927C]/30 bg-gradient-to-r from-[#FFF8F0] to-[#F4E8DC]/40 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B6F5C]">
              Shopping mode
            </p>
            <p className="mt-1 text-sm font-medium text-[#3D3429]">
              {neededCount} item{neededCount === 1 ? "" : "s"} needed · {cartCount}{" "}
              in cart · {sectionCount} section{sectionCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddCartToInventory}
            disabled={cartCount === 0 || !onPantryUpdate}
            className="btn-primary min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add cart to inventory
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-secondary min-h-[44px]"
        >
          + Add item
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <ShoppingItemForm
            title="Add item"
            onSave={handleSaveForm}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {groups.length === 0 ? (
          <div className="empty-state py-10">
            <p className="empty-state-icon" aria-hidden>
              🛍️
            </p>
            <p className="empty-state-title">Shopping list is empty</p>
            <p className="empty-state-text">
              Save meals in Mealdex and low-stock ingredients appear here
              automatically. You can also add items manually or from AI chat.
            </p>
          </div>
        ) : (
          groups.map(({ section, items }) => (
            <ShoppingListGroup
              key={section}
              section={section}
              items={items}
              onTapItem={handleTapItem}
              onDelete={handleDeleteRequest}
            />
          ))
        )}
      </div>

      <ShoppingCartAmountModal
        item={amountItem}
        open={!!amountItem}
        onConfirm={handleConfirmCart}
        onCancel={() => setAmountItem(null)}
      />

      <ShoppingDeleteModal
        item={deleteItem}
        open={!!deleteItem}
        onSubstitute={handleDeleteSubstitute}
        onRemoveMeals={() => {
          if (!deleteItem) return;
          applyState(
            (prev) => removeAffectedMealsFromCurrentPlan(prev, deleteItem.id),
            "Removed affected meals from your current plan."
          );
          setDeleteItem(null);
        }}
        onRemoveOnly={() => {
          if (!deleteItem) return;
          applyState((prev) => removeShoppingListItem(prev, deleteItem.id));
          setDeleteItem(null);
        }}
        onCancel={() => setDeleteItem(null)}
      />

      <ShoppingSubstituteModal
        item={substituteContext?.item ?? null}
        affectedRecipes={substituteContext?.affectedRecipes ?? []}
        localSuggestions={substituteContext?.localSuggestions ?? []}
        appState={appState ?? null}
        open={!!substituteContext}
        onSelect={handleSubstituteSelect}
        onCancel={() => setSubstituteContext(null)}
      />

      {pendingMerge && (
        <ShoppingInventoryMergeModal
          open
          cartItemName={pendingMerge.cartItemName}
          existingName={pendingMerge.existingName}
          onMerge={() => handleMergeDecision("merge")}
          onCreateNew={() => handleMergeDecision("separate")}
          onCancel={() => {
            setPendingMerge(null);
            setMergeDecisions({});
          }}
        />
      )}
    </>
  );
}
