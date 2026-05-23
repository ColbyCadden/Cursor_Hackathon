"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { OverviewCard } from "@/components/OverviewCard";
import { SectionCard } from "@/components/SectionCard";
import { InventoryPreview } from "@/components/InventoryPreview";
import { MealPreviewCard } from "@/components/MealPreviewCard";
import { useAppState } from "@/lib/useAppState";

function DashboardContent() {
  const { state } = useAppState();

  if (!state) return null;

  const { profile, inventory, meals, shoppingList } = state;
  const savedMeals = meals.filter((m) => m.saved);
  const requiredShopping = shoppingList.filter((s) => s.required && !s.bought);

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#3D3429] md:text-3xl">
            Welcome back, {profile.name}
          </h1>
          <p className="mt-2 text-[#8A7B6D]">
            Plan simple meals around what you have, what you like, and how much
            time you&apos;ve got tonight.
          </p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title="Profile status"
            value="Setup pending"
            subtitle="Quiz coming in Stage 2"
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
            value={savedMeals.length}
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
            title="Profile Setup"
            description="Tell PrepDeck how you cook so meal ideas fit your life."
            badge="Stage 2"
          >
            <p className="text-sm leading-relaxed text-[#6B5E52]">
              The profile quiz will ask about your{" "}
              <strong>appliances</strong>, <strong>allergies / foods to avoid</strong>,{" "}
              <strong>eating goals</strong>, <strong>cooking skill & time</strong>, and{" "}
              <strong>simplicity preference</strong>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.eatingGoals.map((goal) => (
                <span
                  key={goal}
                  className="rounded-full bg-[#F4E8DC] px-3 py-1 text-xs text-[#6B5E52]"
                >
                  {goal}
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Inventory"
            description="What's in your fridge, pantry, and freezer right now."
            badge={`${inventory.length} items`}
          >
            <InventoryPreview items={inventory} />
            <p className="mt-4 text-xs text-[#8A7B6D]">
              Full editing and barcode updates coming in later stages.
            </p>
          </SectionCard>

          <SectionCard
            title="Barcode Scanner"
            description="Quickly add groceries by scanning barcodes."
            badge="Coming soon"
          >
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E8DDD0] bg-[#FAF6F0] px-6 py-10 text-center">
              <span className="text-4xl" aria-hidden>
                📷
              </span>
              <p className="mt-3 text-sm font-medium text-[#6B5E52]">
                Real barcode scanning will be connected later
              </p>
              <p className="mt-1 text-xs text-[#8A7B6D]">
                Structure is ready for a scanner API in Stage 2+
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Meal Swipe Cards"
            description="Swipe through simple meal ideas matched to your setup."
            badge="Preview"
          >
            {meals[0] && <MealPreviewCard meal={meals[0]} />}
            <p className="mt-4 text-xs text-[#8A7B6D]">
              Swipe gestures and full card deck coming in Stage 2.
            </p>
          </SectionCard>

          <SectionCard
            title="Meal Library"
            description="Meals you've saved for later."
            badge={`${savedMeals.length} saved`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {savedMeals.map((meal) => (
                <MealPreviewCard key={meal.id} meal={meal} compact />
              ))}
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
