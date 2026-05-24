"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { MealdexIngredientList } from "@/components/MealdexIngredientList";
import { useAppState } from "@/lib/useAppState";
import { getSavedMeals } from "@/lib/meal/mealHelpers";
import { buildMealdexShoppingList } from "@/lib/meal/shoppingList";
import Link from "next/link";

function ShoppingContent() {
  const { state } = useAppState();
  if (!state) return null;

  const savedMeals = getSavedMeals(state);
  const items = buildMealdexShoppingList(savedMeals);

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-2xl">
        <PageHeader
          title="Shopping"
          subtitle="Ingredients pulled from your Mealdex saved meals."
        />

        {savedMeals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--surface)] py-12 text-center">
            <p className="font-bold text-[var(--text)]">No ingredients yet</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Swipe right on Discover to save meals — ingredients appear here
              automatically.
            </p>
            <Link
              href="/discover"
              className="mt-6 inline-block rounded-xl bg-[var(--salmon)] px-6 py-3 text-sm font-bold text-white"
            >
              Open Discover
            </Link>
          </div>
        ) : (
          <>
            <p className="-mt-4 mb-4 text-sm text-[var(--text-muted)]">
              {items.length} items from {savedMeals.length} saved meal
              {savedMeals.length === 1 ? "" : "s"}
            </p>
            <MealdexIngredientList items={items} />
          </>
        )}
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
