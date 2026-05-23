"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { ShoppingListManager } from "@/components/ShoppingListManager";
import { useAppState } from "@/lib/useAppState";

function ShoppingContent() {
  const { state, updateState } = useAppState();
  if (!state) return null;

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-[#3D3429] md:text-3xl">
            Shopping List
          </h1>
          <p className="mt-2 text-sm text-[#8A7B6D] sm:text-base">
            Grouped by aisle-friendly categories — check off items as you shop,
            then add them to your kitchen inventory.
          </p>
        </header>

        <ShoppingListManager
          shoppingList={state.shoppingList}
          inventory={state.inventory}
          onUpdate={(shoppingList, inventory) =>
            updateState((prev) => ({ ...prev, shoppingList, inventory }))
          }
        />
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
