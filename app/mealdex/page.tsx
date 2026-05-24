"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { MealCard } from "@/components/mealdex/MealCard";
import { useAppState } from "@/lib/useAppState";
import {
  getSavedMeals,
  removeFromMealdex,
  resetMealSwipes,
} from "@/lib/meal/mealHelpers";
import { prepMeal } from "@/lib/pantrySync";
import type { Meal } from "@/lib/types";

function MealdexContent() {
  const { state, updateState } = useAppState();
  const [selected, setSelected] = useState<Meal | null>(null);

  if (!state) return null;

  const saved = getSavedMeals(state);

  const confirmReset = () => {
    if (
      window.confirm(
        "Reset all swipes and clear Mealdex? You can swipe the deck again.",
      )
    ) {
      updateState((prev) => resetMealSwipes(prev));
    }
  };

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Mealdex"
            subtitle={`${saved.length} saved meal cards`}
          />
          <button
            type="button"
            onClick={confirmReset}
            className="shrink-0 rounded-lg border border-[#E8D5C4] px-3 py-2 text-xs font-semibold text-[#7A7268]"
          >
            Reset swipes
          </button>
        </div>

        {saved.length === 0 ? (
          <div className="empty-state py-16">
            <p className="empty-state-icon" aria-hidden>
              📚
            </p>
            <p className="empty-state-title">No cards yet</p>
            <p className="empty-state-text">
              Swipe right on Discover to build your collection.
            </p>
            <Link href="/discover" className="btn-primary mt-6 inline-flex">
              Go to Discover
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3">
            {saved.map((meal) => (
              <button
                key={meal.id}
                type="button"
                onClick={() => setSelected(meal)}
                className="text-left"
              >
                <MealCard meal={meal} compact />
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal
          >
            <div className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t-4 border-[#E8A598] bg-[#FFFBF7] p-6 sm:rounded-2xl">
              <h2 className="text-xl font-bold text-[#3D3832]">{selected.name}</h2>
              <p className="mt-4 text-xs font-bold uppercase text-[#7A7268]">
                Ingredients
              </p>
              <ul className="mt-2 space-y-1">
                {selected.ingredients.map((ing) => (
                  <li key={ing} className="text-[#3D3832]">
                    · {ing}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateState((prev) => prepMeal(prev, selected.id));
                    setSelected(null);
                  }}
                  className="rounded-xl bg-[#7BAE7F] py-3 text-sm font-bold text-white"
                >
                  Mark as prepped (deduct from pantry)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateState((prev) => removeFromMealdex(prev, selected.id));
                    setSelected(null);
                  }}
                  className="rounded-xl border border-[#E8A598] py-3 text-sm font-semibold text-[#D48476]"
                >
                  Remove from Mealdex
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-[#E8D5C4] py-3 text-sm font-semibold text-[#7A7268]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function MealdexPage() {
  return (
    <AuthGuard>
      <MealdexContent />
    </AuthGuard>
  );
}
