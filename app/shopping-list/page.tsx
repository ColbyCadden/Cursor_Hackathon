"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ShoppingListManager } from "@/components/ShoppingListManager";
import { useAppState } from "@/lib/useAppState";
import type { AppState } from "@/lib/types";

function ShoppingContent() {
  const { state, updateState } = useAppState();

  if (!state) return null;

  const { shoppingList, profile } = state;

  const handlePantryUpdate = (updater: (prev: AppState) => AppState) => {
    updateState(updater);
  };

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-3xl">
        <PageHeader
          title="Shopping"
          subtitle="Tap items as you shop, add to cart, then confirm everything into Pantry at once."
        />

        <div className="space-y-6">
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
              <Link
                href="/inventory"
                className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface)]"
              >
                Open Pantry
              </Link>
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

          {shoppingList.length === 0 && (
            <section className="rounded-2xl border border-dashed border-[#E8DDD0] bg-[#FAF6F0]/40 p-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                Add items manually here, or ask Chef to suggest groceries for your
                meal plan.
              </p>
              <Link href="/chat" className="btn-primary mt-4 inline-flex">
                Open Chef
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
