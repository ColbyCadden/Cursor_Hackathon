"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { OverviewCard } from "@/components/OverviewCard";
import { PersonalizationSummary } from "@/components/PersonalizationSummary";
import { ProfileSettings } from "@/components/ProfileSettings";
import { SectionCard } from "@/components/SectionCard";
import { QuickNav } from "@/components/QuickNav";
import { PageHeader } from "@/components/PageHeader";
import { useAppState } from "@/lib/useAppState";
import { getDeckMeals, getSavedMeals } from "@/lib/meal/mealHelpers";
import {
  computePantryRequirements,
  getPantrySummary,
} from "@/lib/pantrySync";
import { buildPersonalizedExperience } from "@/lib/signupProfile";

function DashboardContent() {
  const { state, updateState } = useAppState();

  if (!state) return null;

  const { profile, shoppingList, inventory } = state;
  const savedMeals = getSavedMeals(state);
  const deckLeft = getDeckMeals(state).length;
  const pantryReqs = computePantryRequirements(inventory, savedMeals);
  const pantry = getPantrySummary(pantryReqs);
  const experience = buildPersonalizedExperience(profile);

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-5xl">
        <PageHeader title={experience.greeting} subtitle={experience.subtitle} />

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <OverviewCard
            title="Mealdex"
            value={savedMeals.length}
            subtitle={savedMeals.length ? "Saved cards" : "Swipe to save"}
            accent="salmon"
          />
          <OverviewCard
            title="Pantry"
            value={inventory.length}
            subtitle={
              inventory.length
                ? `${pantry.inStock} stocked · ${pantry.low + pantry.missing} low`
                : "Scan groceries"
            }
            accent="honey"
          />
          <OverviewCard
            title="To swipe"
            value={deckLeft}
            subtitle={deckLeft ? "In deck" : "Deck complete"}
            accent="sky"
          />
          <OverviewCard
            title="Shop list"
            value={shoppingList.filter((i) => !i.bought).length}
            subtitle={`${shoppingList.filter((i) => i.source === "mealdex").length} auto · ${shoppingList.filter((i) => i.source !== "mealdex").length} manual`}
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

        <div id="profile" className="mt-6 scroll-mt-24">
          <SectionCard
            title="Your profile"
            description={`Signed in as ${profile.name}${profile.email ? ` · ${profile.email}` : ""}`}
            badge="Settings"
          >
            <PersonalizationSummary profile={profile} />
            <div className="mt-6 border-t border-[#E8DDD0] pt-6">
              <ProfileSettings
                profile={profile}
                onSave={(updatedProfile) =>
                  updateState((prev) => ({ ...prev, profile: updatedProfile }))
                }
              />
            </div>
          </SectionCard>
        </div>
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
