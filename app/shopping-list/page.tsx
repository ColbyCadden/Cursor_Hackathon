"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { MealdexIngredientList } from "@/components/MealdexIngredientList";
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
    savedMeals
  );
  const summary = getPantrySummary(pantryRequirements);
  const { shoppingList, profile } = state;

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
          subtitle="Pantry-aware list — checking items off adds them to your kitchen inventory."
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
            description="Check items off when you buy them — they go straight into Pantry."
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
                <Link
                  href="/inventory"
                  className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
                >
                  Open Pantry
                </Link>
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
