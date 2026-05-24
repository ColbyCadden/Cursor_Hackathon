import { getDefaultForIngredient } from "./ingredientDefaults";
import type { GrocerySection, InventoryCategory, ShoppingCategory } from "./types";
import { isStoreFriendlyUnit } from "./shoppingUnits";

export const GROCERY_SECTIONS: GrocerySection[] = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Grains & Bread",
  "Pantry",
  "Frozen",
  "Spices & Sauces",
  "Snacks",
  "Other",
];

const CATEGORY_TO_GROCERY: Record<InventoryCategory, GrocerySection> = {
  Protein: "Meat & Seafood",
  Carbs: "Grains & Bread",
  Produce: "Produce",
  Fruit: "Produce",
  Dairy: "Dairy & Eggs",
  Snacks: "Snacks",
  "Sauces/Spices": "Spices & Sauces",
  Frozen: "Frozen",
  Other: "Other",
};

export function categoryToGrocerySection(
  category: ShoppingCategory | string
): GrocerySection {
  if (GROCERY_SECTIONS.includes(category as GrocerySection)) {
    return category as GrocerySection;
  }
  return CATEGORY_TO_GROCERY[category as InventoryCategory] ?? "Other";
}

/** Store-friendly buy suggestion from recipe-needed amounts. */
export function suggestBuyAmounts(
  name: string,
  amountNeeded: string,
  unitNeeded: string
): { buyAmount: string; buyUnit: string; equivalentAmount?: string; equivalentUnit?: string } {
  const defaults = getDefaultForIngredient(name);
  const neededNum = parseFloat(amountNeeded.replace(/[^\d.]/g, ""));

  if (unitNeeded === "g" && Number.isFinite(neededNum)) {
    if (name.toLowerCase().includes("chicken breast")) {
      const breasts = Math.max(1, Math.ceil(neededNum / 125));
      return {
        buyAmount: String(breasts),
        buyUnit: "breasts",
        equivalentAmount: amountNeeded,
        equivalentUnit: unitNeeded,
      };
    }
    if (neededNum >= 1000) {
      return {
        buyAmount: String(Math.ceil(neededNum / 100) / 10),
        buyUnit: "kg",
        equivalentAmount: amountNeeded,
        equivalentUnit: unitNeeded,
      };
    }
  }

  if (unitNeeded === "count" || unitNeeded === "breasts" || isStoreFriendlyUnit(unitNeeded)) {
    return {
      buyAmount: amountNeeded,
      buyUnit: unitNeeded,
    };
  }

  return {
    buyAmount: amountNeeded || defaults.amount,
    buyUnit: unitNeeded || defaults.unit,
    equivalentAmount:
      unitNeeded !== defaults.unit ? amountNeeded : undefined,
    equivalentUnit:
      unitNeeded !== defaults.unit ? unitNeeded : undefined,
  };
}

export function formatBuyLabel(buyAmount: string, buyUnit: string): string {
  if (!buyAmount) return "";
  return `${buyAmount} ${buyUnit}`.trim();
}

export function formatNeededLabel(amountNeeded: string, unitNeeded: string): string {
  if (!amountNeeded) return "";
  const unit = unitNeeded ? ` ${unitNeeded}` : "";
  return `about ${amountNeeded}${unit}`;
}
