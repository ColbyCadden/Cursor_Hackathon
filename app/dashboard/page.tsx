"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { OverviewCard } from "@/components/OverviewCard";
import { SectionCard } from "@/components/SectionCard";
import { PersonalizationSummary } from "@/components/PersonalizationSummary";
import { InventoryManager } from "@/components/InventoryManager";
import { BarcodeScannerPanel } from "@/components/BarcodeScannerPanel";
import { QuickNav } from "@/components/QuickNav";
import { PageHeader } from "@/components/PageHeader";
import { Toast } from "@/components/Toast";
import { useAppState } from "@/lib/useAppState";
import { getDeckMeals, getSavedMeals } from "@/lib/meal/mealHelpers";
import { buildMealdexShoppingList } from "@/lib/meal/shoppingList";
import { buildPersonalizedExperience } from "@/lib/signupProfile";

function DashboardContent() {
  const { state, updateState } = useAppState();
  const [toast, setToast] = useState<string | null>(null);

  if (!state) return null;

  const { profile, inventory } = state;
  const savedMeals = getSavedMeals(state);
  const deckLeft = getDeckMeals(state).length;
  const shopItems = buildMealdexShoppingList(savedMeals).length;
  const experience = buildPersonalizedExperience(profile);

  const showToast = (message: string) => setToast(message);

  return (
    <AppShell profile={profile}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mx-auto w-full max-w-lg md:max-w-5xl">
        <PageHeader title={experience.greeting} subtitle={experience.subtitle} />

        <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title="Mealdex"
            value={savedMeals.length}
            subtitle="Saved cards"
            accent="salmon"
          />
          <OverviewCard
            title="To swipe"
            value={deckLeft}
            subtitle="In Discover"
            accent="honey"
          />
          <OverviewCard
            title="Shop list"
            value={shopItems}
            subtitle="From Mealdex"
            accent="sky"
          />
          <OverviewCard
            title="Inventory"
            value={inventory.length}
            subtitle="In kitchen"
            accent="sage"
          />
        </div>

        <SectionCard
          title="Your profile"
          description="Preferences from sign-up — edit anytime."
          badge="Personalized"
        >
          <PersonalizationSummary profile={profile} />
        </SectionCard>

        <div className="mt-6">
          <SectionCard title="Quick links" description="Jump anywhere in PrepDeck." badge="Navigate">
            <QuickNav />
          </SectionCard>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-[var(--salmon)] bg-gradient-to-br from-[var(--surface)] to-[var(--background)] p-6 text-center">
          <h2 className="text-lg font-bold text-[var(--text)]">Ready to swipe?</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Save cards to your Mealdex — shopping updates automatically.
          </p>
          <Link
            href="/discover"
            className="mt-4 inline-block min-h-[48px] rounded-xl bg-[var(--salmon)] px-8 py-3 text-sm font-bold text-white hover:bg-[var(--salmon-dark)]"
          >
            Open Discover →
          </Link>
        </div>

        <div className="mt-8 space-y-6">
          <SectionCard
            title="Inventory"
            description="What's in your fridge and pantry."
            badge={`${inventory.length} items`}
          >
            <InventoryManager
              inventory={inventory}
              onChange={(next) =>
                updateState((prev) => ({ ...prev, inventory: next }))
              }
            />
          </SectionCard>

          <SectionCard title="Barcode Scanner" description="Test mode scanning." badge="Test">
            <BarcodeScannerPanel
              inventory={inventory}
              onInventoryChange={(next) =>
                updateState((prev) => ({ ...prev, inventory: next }))
              }
              onToast={showToast}
            />
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
