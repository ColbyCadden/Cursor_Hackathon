"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { OverviewCard } from "@/components/OverviewCard";
import { SectionCard } from "@/components/SectionCard";
import { PersonalizationSummary } from "@/components/PersonalizationSummary";
import { InventoryManager } from "@/components/InventoryManager";
import { BarcodeScannerPanel } from "@/components/BarcodeScannerPanel";
import { MealSwipeDeck } from "@/components/MealSwipeDeck";
import { MealLibrary } from "@/components/MealLibrary";
import { Toast } from "@/components/Toast";
import { useAppState } from "@/lib/useAppState";
import { buildPersonalizedExperience } from "@/lib/signupProfile";

function DashboardContent() {
  const { state, updateState } = useAppState();
  const [toast, setToast] = useState<string | null>(null);

  if (!state) return null;

  const { profile, inventory, mealLibrary, shoppingList, swipeDeck, swipeIndex } =
    state;
  const requiredShopping = shoppingList.filter((s) => s.required && !s.bought);
  const experience = buildPersonalizedExperience(profile);

  const showToast = (message: string) => setToast(message);

  return (
    <AppShell profile={profile}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-[#3D3429] md:text-3xl">
            {experience.greeting}
          </h1>
          <p className="mt-2 text-[#8A7B6D]">{experience.subtitle}</p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title="Profile"
            value="Personalized"
            subtitle="Based on your sign-up answers"
            accent="honey"
          />
          <OverviewCard
            title="Inventory items"
            value={inventory.length}
            subtitle="Items tracked"
            accent="sage"
          />
          <OverviewCard
            title="Saved meal ideas"
            value={mealLibrary.length}
            subtitle="In your library"
            accent="salmon"
          />
          <OverviewCard
            title="Shopping list"
            value={requiredShopping.length}
            subtitle="Required items left"
            accent="sky"
          />
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Your profile"
            description="The preferences you set when you signed up — edit anytime."
            badge="Personalized"
          >
            <PersonalizationSummary profile={profile} />
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Inventory"
              description="What's in your fridge, pantry, and freezer right now."
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
              title="Barcode Scanner"
              description="Quickly add groceries by scanning barcodes."
              badge="Test mode"
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

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              title="Meal Swipe Cards"
              description="Save meal ideas you like — skip the rest."
              badge={`${swipeIndex}/${swipeDeck.length}`}
            >
              <MealSwipeDeck
                swipeDeck={swipeDeck}
                swipeIndex={swipeIndex}
                mealLibrary={mealLibrary}
                onSwipeIndexChange={(index) =>
                  updateState((prev) => ({ ...prev, swipeIndex: index }))
                }
                onLibraryChange={(library) =>
                  updateState((prev) => ({ ...prev, mealLibrary: library }))
                }
                onToast={showToast}
              />
            </SectionCard>

            <SectionCard
              title="Meal Library"
              description="Saved preferences for your future AI meal planner."
              badge={`${mealLibrary.length} saved`}
            >
              <MealLibrary
                meals={mealLibrary}
                onRemove={(id) =>
                  updateState((prev) => ({
                    ...prev,
                    mealLibrary: prev.mealLibrary.filter((m) => m.id !== id),
                  }))
                }
              />
            </SectionCard>
          </div>
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
