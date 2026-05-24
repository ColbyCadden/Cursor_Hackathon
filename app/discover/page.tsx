"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { SwipeDeck } from "@/components/mealdex/SwipeDeck";
import { useAppState } from "@/lib/useAppState";
import { getDeckMeals, swipeLeft, swipeRight } from "@/lib/meal/mealHelpers";
import Link from "next/link";

function DiscoverContent() {
  const { state, updateState } = useAppState();
  if (!state) return null;

  const deck = getDeckMeals(state);
  const swiped = new Set(state.swipedMealIds);
  const unswipedCount = state.meals.filter((m) => !swiped.has(m.id)).length;
  const filteredOut = unswipedCount > 0 && deck.length === 0;

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto w-full max-w-lg pb-24">
        <header className="mb-2 px-1 pt-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            PrepDeck
          </p>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Discover</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Swipe right to save to Mealdex · {deck.length} left
          </p>
          {filteredOut && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Nothing here matches your signup preferences right now. Try updating
              your{" "}
              <Link href="/profile" className="font-semibold text-[var(--green-dark)] underline">
                profile
              </Link>
              .
            </p>
          )}
          <Link
            href="/create"
            className="mt-2 inline-block text-sm font-semibold text-[var(--green-dark)] underline"
          >
            + Create your own card
          </Link>
        </header>

        <div className="flex min-h-[min(58dvh,520px)] flex-col justify-center py-2">
          <SwipeDeck
            meals={deck}
            onSwipeLeft={(id) => updateState((prev) => swipeLeft(prev, id))}
            onSwipeRight={(id) => updateState((prev) => swipeRight(prev, id))}
          />
        </div>

        <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 md:bottom-6 md:static md:mt-6 md:px-0">
          <Link
            href="/dashboard"
            className="mx-auto flex min-h-[48px] max-w-lg items-center justify-center rounded-xl border-2 border-[var(--card-border)] bg-[var(--surface)] py-3 text-sm font-bold text-[var(--text)] shadow-sm transition hover:border-[var(--salmon)] hover:bg-[var(--background)]"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export default function DiscoverPage() {
  return (
    <AuthGuard>
      <DiscoverContent />
    </AuthGuard>
  );
}
