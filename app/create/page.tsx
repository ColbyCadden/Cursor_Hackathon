"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { MealCreateForm } from "@/components/MealCreateForm";
import { useAppState } from "@/lib/useAppState";
import { addCustomMeal } from "@/lib/meal/mealHelpers";

function CreateContent() {
  const router = useRouter();
  const { state, updateState } = useAppState();
  if (!state) return null;

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto w-full max-w-lg">
        <PageHeader
          title="Create card"
          subtitle="Build your own meal for the swipe deck"
        />
        <MealCreateForm
          onSubmit={(values) => {
            updateState((prev) => addCustomMeal(prev, values));
            router.push("/discover");
          }}
        />
      </div>
    </AppShell>
  );
}

export default function CreatePage() {
  return (
    <AuthGuard>
      <CreateContent />
    </AuthGuard>
  );
}
