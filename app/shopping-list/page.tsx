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
import { buildMealdexShoppingList } from "@/lib/meal/shoppingList";

function ShoppingContent() {
  const { state, updateState } = useAppState();
  if (!state) return null;

  const savedMeals = getSavedMeals(state);
  const mealdexItems = buildMealdexShoppingList(savedMeals);
  const { shoppingList, inventory, profile } = state;

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-3xl">
        <PageHeader
          title="Shopping"
          subtitle="Mealdex ingredients plus your manual list and AI suggestions."
        />

        <div className="space-y-6">
          <SectionCard
            title="Mealdex ingredients"
            description="Auto-generated from meals you saved on Discover."
            badge={`${mealdexItems.length} items`}
          >
            {savedMeals.length === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-icon" aria-hidden>
                  🛒
                </p>
                <p className="empty-state-title">No ingredients yet</p>
                <p className="empty-state-text">
                  Swipe right on Discover to save meals — ingredients appear here
                  automatically.
                </p>
                <Link href="/discover" className="btn-primary mt-4 inline-flex">
                  Open Discover
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
            title="Your shopping list"
            description="Add items manually or from AI chat. Mark bought, then move to inventory."
            badge={`${shoppingList.length} items`}
          >
            <ShoppingListManager
              shoppingList={shoppingList}
              inventory={inventory}
              onUpdate={(nextList, nextInventory) =>
                updateState((prev) => ({
                  ...prev,
                  shoppingList: nextList,
                  inventory: nextInventory,
                }))
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
