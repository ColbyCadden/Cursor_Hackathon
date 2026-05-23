"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/useAppState";
import type { ShoppingCategory, ShoppingListItem } from "@/lib/types";

const categoryOrder: ShoppingCategory[] = [
  "Protein",
  "Carbs",
  "Produce",
  "Dairy",
  "Other",
];

function groupByCategory(items: ShoppingListItem[]) {
  return categoryOrder
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
}

function ShoppingContent() {
  const { state } = useAppState();
  if (!state) return null;

  const groups = groupByCategory(state.shoppingList);

  return (
    <AppShell profile={state.profile}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[#3D3429] md:text-3xl">
            Shopping List
          </h1>
          <p className="mt-2 text-[#8A7B6D]">
            Keep track of what you need to buy — grouped by aisle-friendly
            categories for quick store runs.
          </p>
        </header>

        <div className="space-y-6">
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E8DDD0] bg-[#FAF6F0] px-6 py-12 text-center">
              <p className="text-sm text-[#8A7B6D]">
                Your shopping list is empty. Ask the AI meal planner to suggest
                items, then add them from chat.
              </p>
            </div>
          ) : (
            groups.map(({ category, items }) => (
              <section
                key={category}
                className="rounded-2xl border border-[#E8DDD0] bg-white/80 p-5 shadow-sm"
              >
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#8B6F5C]">
                  {category}
                </h2>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg bg-[#FAF6F0] px-3 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={item.bought}
                        readOnly
                        className="h-4 w-4 rounded border-[#E8DDD0] accent-[#E8927C]"
                        aria-label={`Mark ${item.name} as bought`}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-[#3D3429]">
                          {item.name}
                        </span>
                        <span className="ml-2 text-xs text-[#8A7B6D]">
                          {item.amount} {item.unit}
                        </span>
                      </div>
                      {!item.required && (
                        <span className="rounded-full bg-[#F4E8DC] px-2 py-0.5 text-xs text-[#8A7B6D]">
                          optional
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl bg-[#E8927C]/50 px-5 py-2.5 text-sm font-semibold text-white opacity-70"
          >
            Add bought items to inventory
          </button>
          <p className="text-xs text-[#8A7B6D]">
            Items added from AI chat appear here automatically.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

export default function ShoppingListPage() {
  return (
    <AuthGuard>
      <ShoppingContent />
    </AuthGuard>
  );
}
