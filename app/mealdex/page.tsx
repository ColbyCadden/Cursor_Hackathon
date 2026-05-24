"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SectionCard } from "@/components/SectionCard";
import { SwipeDeck } from "@/components/mealdex/SwipeDeck";
import { MealCard } from "@/components/mealdex/MealCard";
import { MealCreateForm } from "@/components/MealCreateForm";
import { useAppState } from "@/lib/useAppState";
import {
  addCustomMeal,
  getDeckMeals,
  getSavedMeals,
  removeFromMealdex,
  resetMealSwipes,
  swipeLeft,
  swipeRight,
} from "@/lib/meal/mealHelpers";
import { prepMeal } from "@/lib/pantrySync";
import type { Meal } from "@/lib/types";

function MealdexContent() {
  const { state, updateState } = useAppState();
  const [selected, setSelected] = useState<Meal | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (!state) return null;

  const deck = getDeckMeals(state);
  const saved = getSavedMeals(state);
  const swiped = new Set(state.swipedMealIds);
  const unswipedCount = state.meals.filter((m) => !swiped.has(m.id)).length;
  const filteredOut = unswipedCount > 0 && deck.length === 0;

  const confirmReset = () => {
    if (
      window.confirm(
        "Reset all swipes and clear Mealdeck? You can swipe the deck again.",
      )
    ) {
      updateState((prev) => resetMealSwipes(prev));
    }
  };

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto w-full max-w-3xl pb-24 md:pb-8">
        <div className="relative mb-4 flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Mealdeck"
            subtitle="Swipe to discover · saved cards below"
          />
          <p className="max-w-[9.5rem] text-right text-[10px] leading-snug text-[var(--text-muted)]">
            Available meals align with your cooking preferences
          </p>
        </div>

        <SectionCard
          title="Discover"
          description={`Swipe right to save · ${deck.length} left in deck`}
          badge="Swipe"
        >
          {filteredOut && (
            <p className="mb-4 text-sm text-[var(--text-muted)]">
              Nothing matches your diet or equipment right now. Update your{" "}
              <Link href="/dashboard#profile" className="font-semibold text-[var(--green-dark)] underline">
                profile
              </Link>
              .
            </p>
          )}
          <SwipeDeck
            meals={deck}
            onSwipeLeft={(id) => updateState((prev) => swipeLeft(prev, id))}
            onSwipeRight={(id) => updateState((prev) => swipeRight(prev, id))}
          />
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="mt-4 text-sm font-semibold text-[var(--green-dark)] underline"
          >
            {showCreate ? "Cancel create" : "+ Create your own card"}
          </button>
          {showCreate && (
            <div className="mt-4 border-t border-[var(--card-border)] pt-4">
              <MealCreateForm
                onSubmit={(values) => {
                  updateState((prev) => addCustomMeal(prev, values));
                  setShowCreate(false);
                }}
              />
            </div>
          )}
        </SectionCard>

        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[var(--text)]">
              Your collection ({saved.length})
            </h2>
            <button
              type="button"
              onClick={confirmReset}
              className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)]"
            >
              Reset swipes
            </button>
          </div>

          {saved.length === 0 ? (
            <div className="empty-state py-10">
              <p className="empty-state-icon" aria-hidden>
                📚
              </p>
              <p className="empty-state-title">No saved cards yet</p>
              <p className="empty-state-text">
                Swipe right on a meal above to add it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        </div>

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
                  Remove from Mealdeck
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
