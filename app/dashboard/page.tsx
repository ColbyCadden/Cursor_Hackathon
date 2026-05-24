"use client";

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
import Link from "next/link";

function DashboardContent() {
  const { state, updateState } = useAppState();
  const [toast, setToast] = useState<string | null>(null);

  if (!state) return null;

  const { profile, inventory, shoppingList } = state;
  const savedMeals = getSavedMeals(state);
  const deckLeft = getDeckMeals(state).length;
  const shopItems = buildMealdexShoppingList(savedMeals).length;
  const aiListCount = shoppingList.length;
  const experience = buildPersonalizedExperience(profile);

  const showToast = (message: string) => setToast(message);

  return (
    <AppShell profile={profile}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mx-auto w-full max-w-lg md:max-w-5xl">
        <PageHeader title={experience.greeting} subtitle={experience.subtitle} />

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

        <div className="mt-6 rounded-2xl border border-[var(--salmon)] bg-gradient-to-br from-[var(--surface)] to-[var(--background)] p-6 text-center">
          <h2 className="text-lg font-bold text-[var(--text)]">Ready to swipe?</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Save cards to your Mealdex — shopping updates automatically.
          </p>
          <Link href="/discover" className="btn-primary mt-4 inline-flex min-h-[48px] px-8">
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

          <SectionCard
            title="Barcode scanner"
            description="Demo test scans — real hardware plugs in here later."
            badge="Demo"
          >
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
