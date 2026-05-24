"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { MealdexIngredientList } from "@/components/MealdexIngredientList";
import { InventoryManager } from "@/components/InventoryManager";
import { ShoppingListManager } from "@/components/ShoppingListManager";
import { useAppState } from "@/lib/useAppState";
import { getSavedMeals } from "@/lib/meal/mealHelpers";
import {
  computePantryRequirements,
  getPantrySummary,
  syncPantryState,
} from "@/lib/pantrySync";
import type { AppState } from "@/lib/types";

function ShoppingContent() {
  const { state, updateState } = useAppState();
  if (!state) return null;

  const savedMeals = getSavedMeals(state);
  const pantryRequirements = computePantryRequirements(
    state.inventory,
    savedMeals,
  );
  const summary = getPantrySummary(pantryRequirements);
  const { shoppingList, inventory, profile } = state;

  const handlePantryUpdate = (updater: (prev: AppState) => AppState) => {
    updateState(updater);
  };

  const handleResync = () => {
    updateState((prev) => syncPantryState(prev));
  };

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-3xl">
        <PageHeader
          title="Shopping"
          subtitle="Pantry-aware list — auto-updates when you're low on ingredients for saved meals."
        />

        <div className="space-y-6">
          <SectionCard
            title="Pantry vs Mealdex"
            description="Ingredients needed for your saved meals, checked against what you have."
            badge={
              savedMeals.length
                ? `${summary.inStock} stocked · ${summary.low + summary.missing} need attention`
                : undefined
            }
          >
            {savedMeals.length === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-icon" aria-hidden>
                  🛒
                </p>
                <p className="empty-state-title">No ingredients yet</p>
                <p className="empty-state-text">
                  Swipe right in Mealdex to save meals — we&apos;ll track what
                  you need and what&apos;s already in your pantry.
                </p>
                <Link href="/mealdex" className="btn-primary mt-4 inline-flex">
                  Open Mealdex
                </Link>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-[var(--text-muted)]">
                  {pantryRequirements.length} ingredients across{" "}
                  {savedMeals.length} saved meal
                  {savedMeals.length === 1 ? "" : "s"}. Low or missing items
                  are added to your shopping list below.
                </p>
                <MealdexIngredientList items={pantryRequirements} />
              </>
            )}
          </SectionCard>

          <SectionCard
            title="Your shopping list"
            description="Auto-filled from low stock, plus manual and AI items. Mark bought, then add to pantry."
            badge={`${shoppingList.length} items`}
          >
            {savedMeals.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleResync}
                  className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
                >
                  Sync from pantry
                </button>
              </div>
            )}
            <ShoppingListManager
              shoppingList={shoppingList}
              appState={state}
              onPantryUpdate={handlePantryUpdate}
              onUpdate={(nextList) =>
                updateState((prev) => ({ ...prev, shoppingList: nextList }))
              }
            />
          </SectionCard>

          <SectionCard
            title="Kitchen inventory"
            description="What you have at home — updates pantry matching and syncs your shopping list."
            badge={`${inventory.length} items`}
          >
            <InventoryManager
              inventory={inventory}
              onChange={(next) =>
                updateState((prev) =>
                  syncPantryState({ ...prev, inventory: next }),
                )
              }
            />
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

export default function ShoppingListPage() {
  return (
    <AuthGuard>
      <ShoppingContent />
    </AuthGuard>
  );
}
