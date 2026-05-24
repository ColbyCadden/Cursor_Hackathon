"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { OverviewCard } from "@/components/OverviewCard";
import { SectionCard } from "@/components/SectionCard";
import { QuickNav } from "@/components/QuickNav";
import { PageHeader } from "@/components/PageHeader";
import { useAppState } from "@/lib/useAppState";
import { getDeckMeals, getSavedMeals } from "@/lib/meal/mealHelpers";
import { buildMealdexShoppingList } from "@/lib/meal/shoppingList";
import { buildPersonalizedExperience } from "@/lib/signupProfile";

function DashboardContent() {
  const { state } = useAppState();

  if (!state) return null;

  const { profile, shoppingList } = state;
  const savedMeals = getSavedMeals(state);
  const deckLeft = getDeckMeals(state).length;
  const shopItems = buildMealdexShoppingList(savedMeals).length;
  const aiListCount = shoppingList.length;
  const experience = buildPersonalizedExperience(profile);

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-5xl">
        <PageHeader title={experience.greeting} subtitle={experience.subtitle} />

        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          <OverviewCard
            title="Mealdex"
            value={savedMeals.length}
            subtitle={savedMeals.length ? "Saved cards" : "Swipe to save"}
            accent="salmon"
          />
          <OverviewCard
            title="To swipe"
            value={deckLeft}
            subtitle={deckLeft ? "In Discover" : "Deck complete"}
            accent="honey"
          />
          <OverviewCard
            title="Shop list"
            value={shopItems + aiListCount}
            subtitle={`${shopItems} Mealdex · ${aiListCount} manual`}
            accent="sky"
          />
        </div>

        <SectionCard
          title="Quick links"
          description="Jump anywhere in PrepDeck."
          badge="Navigate"
        >
          <QuickNav />
        </SectionCard>
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
