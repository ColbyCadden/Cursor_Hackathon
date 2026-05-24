"use client";

import { useState } from "react";
import {
  formatBuyLabel,
  formatNeededLabel,
} from "@/lib/grocerySections";
import {
  getAmountNeeded,
  getBuyAmount,
  getBuyUnit,
  getUnitNeeded,
  getUsedInRecipes,
  isItemInCart,
} from "@/lib/shoppingItemUtils";
import type { ShoppingListItem } from "@/lib/types";

interface ShoppingListItemCardProps {
  item: ShoppingListItem;
  onTap: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
}

export function ShoppingListItemCard({
  item,
  onTap,
  onDelete,
}: ShoppingListItemCardProps) {
  const [expandedRecipes, setExpandedRecipes] = useState(false);
  const inCart = isItemInCart(item);
  const usedIn = getUsedInRecipes(item);
  const buyLabel = formatBuyLabel(getBuyAmount(item), getBuyUnit(item));
  const neededLabel = formatNeededLabel(
    getAmountNeeded(item),
    getUnitNeeded(item)
  );

  const usedInLabel =
    usedIn.length === 0
      ? null
      : usedIn.length <= 2
        ? `Used in: ${usedIn.join(", ")}`
        : expandedRecipes
          ? `Used in: ${usedIn.join(", ")}`
          : `Used in ${usedIn.length} recipes`;

  return (
    <li>
      <div
        className={`rounded-xl border p-3 transition-colors ${
          inCart
            ? "border-[#E8DDD0] bg-[#F0EBE3]/80 opacity-75"
            : "border-[#E8DDD0] bg-[#FAF6F0] hover:border-[#E8927C]/40"
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onTap(item)}
              className={`w-full rounded-lg p-2 text-left transition-colors ${
                inCart ? "" : "hover:bg-white/60 active:bg-white"
              }`}
              aria-label={`${inCart ? "Edit cart amount for" : "Add to cart"} ${item.name}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-medium text-[#3D3429] ${
                    inCart ? "text-[#8A7B6D]" : ""
                  }`}
                >
                  {item.name}
                </span>
                {!item.required && (
                  <span className="rounded-full bg-[#F4E8DC] px-2 py-0.5 text-xs text-[#8A7B6D]">
                    Optional
                  </span>
                )}
                {inCart && (
                  <span className="rounded-full bg-[#E8E8E8] px-2 py-0.5 text-xs text-[#6B5E52]">
                    In cart
                  </span>
                )}
                {item.source === "mealdex" && (
                  <span className="rounded-full bg-[#E3F2FD] px-2 py-0.5 text-xs text-[#1565C0]">
                    auto
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-medium text-[#6B5E52]">
                Buy: {inCart && item.boughtAmount ? `${item.boughtAmount} ${item.boughtUnit}` : buyLabel}
              </p>
              {!inCart && (
                <p className="mt-0.5 text-[10px] text-[#E8927C]">Tap to add to cart →</p>
              )}
              <p className="mt-0.5 text-xs text-[#8A7B6D]">Needed: {neededLabel}</p>
              {item.grocerySection && (
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#B0A090]">
                  {item.grocerySection}
                </p>
              )}
              {item.reason && !usedIn.length && (
                <p className="mt-1 text-xs italic text-[#8A7B6D]">{item.reason}</p>
              )}
            </button>
            {usedInLabel &&
              (usedIn.length >= 3 ? (
                <button
                  type="button"
                  onClick={() => setExpandedRecipes((v) => !v)}
                  className="mx-2 mb-1 block text-xs text-[#8A7B6D] underline-offset-2 hover:underline"
                >
                  {usedInLabel}
                  {!expandedRecipes ? " · tap to expand" : ""}
                </button>
              ) : (
                <p className="mx-2 mb-1 text-xs text-[#8A7B6D]">{usedInLabel}</p>
              ))}
          </div>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="shrink-0 rounded-lg p-2 text-[#B85C4A] hover:bg-white/80"
            aria-label={`Delete ${item.name}`}
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}
