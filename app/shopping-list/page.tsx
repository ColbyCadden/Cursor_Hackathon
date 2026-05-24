"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { MealdexIngredientList } from "@/components/MealdexIngredientList";
import { InventoryManager } from "@/components/InventoryManager";
import { useAppState } from "@/lib/useAppState";
import { getSavedMeals } from "@/lib/meal/mealHelpers";
import { buildMealdexShoppingList } from "@/lib/meal/shoppingList";

function ShoppingContent() {
  const { state, updateState } = useAppState();
  if (!state) return null;

  const savedMeals = getSavedMeals(state);
  const mealdexItems = buildMealdexShoppingList(savedMeals);
  const { inventory, profile } = state;

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-3xl">
        <PageHeader
          title="Shopping"
          subtitle="Groceries from Mealdex plus what's in your kitchen."
        />

        <div className="space-y-6">
          <SectionCard
            title="Mealdex shopping list"
            description="Ingredients from meals you saved — your cart for the store."
            badge={`${mealdexItems.length} items`}
          >
            {savedMeals.length === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-icon" aria-hidden>
                  🛒
                </p>
                <p className="empty-state-title">No ingredients yet</p>
                <p className="empty-state-text">
                  Swipe right in Mealdex to save meals — ingredients appear here.
                </p>
                <Link href="/mealdex" className="btn-primary mt-4 inline-flex">
                  Open Mealdex
                </Link>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-[var(--text-muted)]">
                  {mealdexItems.length} items from {savedMeals.length} saved meal
                  {savedMeals.length === 1 ? "" : "s"}
                </p>
                <MealdexIngredientList items={mealdexItems} />
              </>
            )}
          </SectionCard>

          <SectionCard
            title="Kitchen inventory"
            description="What you already have at home — the AI uses this with your shopping list."
            badge={`${inventory.length} items`}
          >
            <InventoryManager
              inventory={inventory}
              onChange={(next) =>
                updateState((prev) => ({ ...prev, inventory: next }))
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
