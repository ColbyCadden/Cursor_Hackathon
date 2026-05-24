"use client";

import { useEffect, useState } from "react";
import type { ShoppingListItem } from "@/lib/types";
import type { AppState } from "@/lib/types";

interface ShoppingSubstituteModalProps {
  item: ShoppingListItem | null;
  affectedRecipes: string[];
  localSuggestions: string[];
  appState: AppState | null;
  open: boolean;
  onSelect: (substitute: string) => void;
  onCancel: () => void;
}

export function ShoppingSubstituteModal({
  item,
  affectedRecipes,
  localSuggestions,
  appState,
  open,
  onSelect,
  onCancel,
}: ShoppingSubstituteModalProps) {
  const [suggestions, setSuggestions] = useState<string[]>(localSuggestions);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSuggestions(localSuggestions);
  }, [localSuggestions, item?.id]);

  useEffect(() => {
    if (!open || !item || !appState) return;

    let cancelled = false;
    setLoading(true);

    fetch("/api/substitutes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientName: item.name,
        usedInRecipes: affectedRecipes,
        profile: appState.profile,
        inventory: appState.inventory,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.substitutes?.length) return;
        setSuggestions(data.substitutes);
      })
      .catch(() => {
        /* keep local */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, item, affectedRecipes, appState]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/35"
        onClick={onCancel}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E8DDD0] bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#3D3429]">
          Substitute for {item.name}
        </h3>
        {affectedRecipes.length > 0 && (
          <p className="mt-2 text-sm text-[#6B5E52]">
            Used in: {affectedRecipes.join(", ")}
          </p>
        )}
        <p className="mt-3 text-sm text-[#8A7B6D]">
          Choose a substitute — we won&apos;t apply it until you tap one.
        </p>

        {loading && (
          <p className="mt-4 text-xs text-[#8A7B6D]">Loading suggestions…</p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {suggestions.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => onSelect(sub)}
              className="min-h-[44px] rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-2.5 text-left text-sm font-medium text-[#3D3429] hover:bg-[#F4E8DC]/60"
            >
              {sub}
            </button>
          ))}
          {!loading && suggestions.length === 0 && (
            <p className="text-sm text-[#8A7B6D]">
              No substitutes found — try removing the item or editing your plan in
              chat.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm text-[#8A7B6D] hover:bg-[#FAF6F0]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
