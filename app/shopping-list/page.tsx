"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { MealdexIngredientList } from "@/components/MealdexIngredientList";
import { PageHeader } from "@/components/PageHeader";
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
  const [showPantryReference, setShowPantryReference] = useState(false);

  useEffect(() => {
    updateState((prev) => syncPantryState(prev));
  }, [updateState]);

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
          subtitle="Tap items as you shop, add to cart, then confirm everything into Pantry at once."
        />

        <div className="space-y-6">
          {/* Primary: grocery shopping mode */}
          <section className="rounded-2xl border border-[#E8DDD0] bg-white/90 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#3D3429]">
                  Grocery list
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Grouped by store aisle — tap each item when you pick it up.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedMeals.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResync}
                    className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
                  >
                    Sync from Mealdex
                  </button>
                )}
                <Link
                  href="/inventory"
                  className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
                >
                  Open Pantry
                </Link>
              </div>
            </div>

            <ShoppingListManager
              shoppingList={shoppingList}
              appState={state}
              onPantryUpdate={handlePantryUpdate}
              onUpdate={(nextList) =>
                updateState((prev) => ({ ...prev, shoppingList: nextList }))
              }
            />
          </section>

          {/* Secondary: pantry reference (collapsed by default) */}
          {savedMeals.length > 0 && (
            <section className="rounded-2xl border border-[#E8DDD0]/80 bg-[#FAF6F0]/60">
              <button
                type="button"
                onClick={() => setShowPantryReference((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
                aria-expanded={showPantryReference}
              >
                <div>
                  <h2 className="text-sm font-semibold text-[#6B5E52]">
                    Pantry vs Mealdex
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Reference only — shop from the list above
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {summary.inStock} stocked · {summary.low + summary.missing}{" "}
                    need attention · {pantryRequirements.length} ingredients
                  </p>
                </div>
                <span className="text-lg text-[#8A7B6D]" aria-hidden>
                  {showPantryReference ? "−" : "+"}
                </span>
              </button>
              {showPantryReference && (
                <div className="border-t border-[#E8DDD0]/60 px-4 pb-4 pt-3 sm:px-5">
                  <p className="mb-3 text-xs text-[var(--text-muted)]">
                    Ingredients across {savedMeals.length} saved meal
                    {savedMeals.length === 1 ? "" : "s"}. Low or missing items
                    sync into your grocery list above.
                  </p>
                  <MealdexIngredientList items={pantryRequirements} />
                </div>
              )}
            </section>
          )}

          {savedMeals.length === 0 && (
            <section className="rounded-2xl border border-dashed border-[#E8DDD0] bg-[#FAF6F0]/40 p-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Save meals in Mealdex to auto-fill your grocery list.
              </p>
              <Link href="/mealdex" className="btn-primary mt-4 inline-flex">
                Open Mealdex
              </Link>
            </section>
          )}
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
