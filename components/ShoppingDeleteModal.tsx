"use client";

import { ChoiceModal } from "./ChoiceModal";
import { getUsedInRecipes } from "@/lib/shoppingItemUtils";
import type { ShoppingListItem } from "@/lib/types";

interface ShoppingDeleteModalProps {
  item: ShoppingListItem | null;
  open: boolean;
  onSubstitute: () => void;
  onRemoveMeals: () => void;
  onRemoveOnly: () => void;
  onCancel: () => void;
}

export function ShoppingDeleteModal({
  item,
  open,
  onSubstitute,
  onRemoveMeals,
  onRemoveOnly,
  onCancel,
}: ShoppingDeleteModalProps) {
  if (!item) return null;

  const usedIn = getUsedInRecipes(item);
  const hasRecipes = usedIn.length > 0;

  if (!hasRecipes) {
    return (
      <ChoiceModal
        open={open}
        title={`Remove ${item.name}?`}
        onCancel={onCancel}
        onSelect={(id) => {
          if (id === "remove") onRemoveOnly();
          else onCancel();
        }}
        options={[
          { id: "remove", label: "Remove item", variant: "danger" },
        ]}
      >
        <p>This item is not linked to any recipes in your current plan.</p>
      </ChoiceModal>
    );
  }

  return (
    <ChoiceModal
      open={open}
      title={`Remove ${item.name}?`}
      onCancel={onCancel}
      onSelect={(id) => {
        if (id === "substitute") onSubstitute();
        else if (id === "remove-meals") onRemoveMeals();
        else if (id === "remove-only") onRemoveOnly();
        else onCancel();
      }}
      options={[
        { id: "substitute", label: "Substitute ingredient", variant: "primary" },
        {
          id: "remove-meals",
          label: "Remove affected meals from current plan",
          variant: "secondary",
        },
        {
          id: "remove-only",
          label: "Remove item only",
          variant: "danger",
        },
      ]}
    >
      <p>
        {item.name} is used in {usedIn.length} recipe
        {usedIn.length === 1 ? "" : "s"}:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {usedIn.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <p className="mt-3">What do you want to do?</p>
    </ChoiceModal>
  );
}
