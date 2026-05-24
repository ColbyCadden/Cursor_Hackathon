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
import { getSavedMeals } from "@/lib/meal/mealHelpers";

function DashboardContent() {
  const { state, updateState } = useAppState();
  const [showProfileForm, setShowProfileForm] = useState(false);

  if (!state) return null;

  const { profile, shoppingList, inventory } = state;
  const savedMeals = getSavedMeals(state);
  const recipesCreated = state.recipesCreated ?? 0;

  return (
    <AppShell profile={profile}>
      <div className="w-full max-w-lg md:max-w-none">
        <PageHeader title={`Hey ${profile.name},`} />

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <OverviewCard
            title="MealDeck"
            value={savedMeals.length}
            subtitle="cards"
            accent="salmon"
          />
          <OverviewCard
            title="Pantry"
            value={inventory.length}
            subtitle="items"
            accent="honey"
          />
          <OverviewCard
            title="Recipes"
            value={recipesCreated}
            subtitle="created"
            accent="sky"
          />
          <OverviewCard
            title="Shopping"
            value={shoppingList.filter((i) => !i.bought).length}
            subtitle="items"
            accent="sage"
          />
        </div>

        <div id="profile" className="scroll-mt-24">
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
