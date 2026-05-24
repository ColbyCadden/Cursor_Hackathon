"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { OverviewCard } from "@/components/OverviewCard";
import { PersonalizationSummary } from "@/components/PersonalizationSummary";
import { ProfileSettings } from "@/components/ProfileSettings";
import { SectionCard } from "@/components/SectionCard";
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
  const [showProfileForm, setShowProfileForm] = useState(false);

  if (!state) return null;

  const { profile, shoppingList, inventory } = state;
  const savedMeals = getSavedMeals(state);
  const deckLeft = getDeckMeals(state).length;
  const pantryReqs = computePantryRequirements(inventory, savedMeals);
  const pantry = getPantrySummary(pantryReqs);
  const experience = buildPersonalizedExperience(profile);

  return (
    <AppShell profile={profile}>
      <div className="mx-auto w-full max-w-lg md:max-w-6xl">
        <PageHeader title={experience.greeting} subtitle={experience.subtitle} />

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 md:gap-5">
          <OverviewCard
            title="Mealdeck"
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
            accent="sage"
          />
        </div>

        <div id="profile" className="scroll-mt-24 md:mx-auto md:max-w-3xl">
          <SectionCard
            title="Your profile"
            description={`Signed in as ${profile.name}${profile.email ? ` · ${profile.email}` : ""}`}
          >
            <PersonalizationSummary profile={profile} />
            <button
              type="button"
              onClick={() => setShowProfileForm((open) => !open)}
              className="mt-4 inline-flex rounded-xl border border-[#E8DDD0] bg-white px-5 py-2.5 text-sm font-medium text-[#6B5E52] transition hover:bg-[#F4E8DC]/60"
              aria-expanded={showProfileForm}
            >
              {showProfileForm ? "Hide profile settings" : "Edit profile"}
            </button>
            {showProfileForm && (
              <div className="mt-4 border-t border-[#E8DDD0] pt-6">
                <ProfileSettings
                  profile={profile}
                  onSave={(updatedProfile) => {
                    updateState((prev) => ({ ...prev, profile: updatedProfile }));
                    setShowProfileForm(false);
                  }}
                />
              </div>
            )}
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
