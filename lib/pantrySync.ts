import { deriveIngredientTags } from "./ingredientAliases";
import { categoryToGrocerySection } from "./grocerySections";
import { getDefaultForIngredient } from "./ingredientDefaults";
import { createId } from "./id";
import {
  findInventoryMatch,
  ingredientsMatch,
  normalizeIngredientName,
} from "./inventoryMatching";
import { buildMealdexShoppingList } from "./meal/shoppingList";
import { suggestBuyAmounts } from "./grocerySections";
import { normalizeShoppingItem } from "./shoppingItemUtils";
import type {
  AppState,
  InventoryItem,
  InventoryUpdate,
  Meal,
  ShoppingListItem,
} from "./types";

export const LOW_STOCK_THRESHOLD = 2;

export type PantryStatus = "in_stock" | "low" | "missing";

export interface PantryRequirement {
  name: string;
  amountNeeded: string;
  unit: string;
  category: ShoppingListItem["category"];
  status: PantryStatus;
  portionsLeft: number | null;
  matchedInventoryId: string | null;
  mealNames: string[];
  mealCount: number;
}

function parseAmount(amount: string): number | null {
  const n = parseFloat(amount.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function enrichInventory(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.map((item) => ({
    ...item,
    ingredientTags:
      item.ingredientTags ?? deriveIngredientTags(item.name, item.category),
  }));
}

export function computePantryRequirements(
  inventory: InventoryItem[],
  savedMeals: Meal[]
): PantryRequirement[] {
  const stocked = enrichInventory(inventory);
  const merged = buildMealdexShoppingList(savedMeals);

  return merged.map((item) => {
    const defaults = getDefaultForIngredient(item.name);
    const match = findInventoryMatch(stocked, item.name);

    let amountNeeded = defaults.amount;
    if (item.count > 1) {
      const base = parseAmount(defaults.amount);
      if (base !== null) {
        amountNeeded = String(base * item.count);
      }
    }

    if (!match) {
      return {
        name: item.name,
        amountNeeded,
        unit: defaults.unit,
        category: defaults.category,
        status: "missing" as const,
        portionsLeft: null,
        matchedInventoryId: null,
        mealNames: item.mealNames,
        mealCount: item.count,
      };
    }

    const portionsLeft = match.portionsLeft;
    const status: PantryStatus =
      portionsLeft <= LOW_STOCK_THRESHOLD ? "low" : "in_stock";

    return {
      name: item.name,
      amountNeeded,
      unit: defaults.unit,
      category: defaults.category,
      status,
      portionsLeft,
      matchedInventoryId: match.id,
      mealNames: item.mealNames,
      mealCount: item.count,
    };
  });
}

/** Auto-add low/missing Mealdex ingredients to the shopping list. */
export function syncShoppingListForPantry(
  shoppingList: ShoppingListItem[],
  requirements: PantryRequirement[]
): ShoppingListItem[] {
  const needsRestock = requirements.filter(
    (r) => r.status === "missing" || r.status === "low"
  );
  const neededKeys = new Set(
    needsRestock.map((r) => normalizeIngredientName(r.name))
  );

  const kept = shoppingList.filter((item) => {
    if (item.source !== "mealdex") return true;
    if (item.bought) return true;
    return neededKeys.has(normalizeIngredientName(item.name));
  });

  const list = [...kept];

  for (const req of needsRestock) {
    const idx = list.findIndex(
      (item) =>
        !item.bought &&
        ingredientsMatch(item.name, req.name)
    );

    if (idx === -1) {
      const buy = suggestBuyAmounts(req.name, req.amountNeeded, req.unit);
      list.push(
        normalizeShoppingItem({
          id: createId("shop"),
          name: req.name,
          amount: req.amountNeeded,
          unit: req.unit,
          amountNeeded: req.amountNeeded,
          unitNeeded: req.unit,
          buyAmount: buy.buyAmount,
          buyUnit: buy.buyUnit,
          equivalentAmount: buy.equivalentAmount,
          equivalentUnit: buy.equivalentUnit,
          category: req.category,
          grocerySection: categoryToGrocerySection(req.category),
          required: true,
          bought: false,
          addedToInventory: false,
          inCart: false,
          source: "mealdex",
          usedInRecipes: req.mealNames,
        })
      );
      continue;
    }

    const existing = list[idx];
    if (existing.source === "mealdex" || existing.source === undefined) {
      const buy = suggestBuyAmounts(req.name, req.amountNeeded, req.unit);
      list[idx] = normalizeShoppingItem({
        ...existing,
        amount: req.amountNeeded,
        unit: req.unit,
        amountNeeded: req.amountNeeded,
        unitNeeded: req.unit,
        buyAmount: buy.buyAmount,
        buyUnit: buy.buyUnit,
        equivalentAmount: buy.equivalentAmount,
        equivalentUnit: buy.equivalentUnit,
        category: req.category,
        grocerySection: categoryToGrocerySection(req.category),
        source: existing.source ?? "mealdex",
        usedInRecipes: req.mealNames,
      });
    }
  }

  return list;
}

export function deductIngredientFromInventory(
  inventory: InventoryItem[],
  ingredientName: string,
  amountUsed?: string,
  _unit?: string
): InventoryItem[] {
  const match = findInventoryMatch(inventory, ingredientName);
  if (!match) return inventory;

  const defaults = getDefaultForIngredient(ingredientName);
  const usedAmount = amountUsed ?? defaults.amount;
  const usedNum = parseAmount(usedAmount);
  const currentNum = parseAmount(match.amount);

  if (usedNum !== null && currentNum !== null && currentNum > 0) {
    const newAmount = Math.max(0, currentNum - usedNum);
    const portionsUsed = Math.max(1, Math.round((usedNum / currentNum) * match.portionsLeft));

    return inventory.map((item) =>
      item.id === match.id
        ? {
            ...item,
            amount: String(newAmount),
            portionsLeft: Math.max(0, item.portionsLeft - portionsUsed),
          }
        : item
    );
  }

  const portionsPerUse = 1;
  return inventory.map((item) =>
    item.id === match.id
      ? {
          ...item,
          portionsLeft: Math.max(0, item.portionsLeft - portionsPerUse),
        }
      : item
  );
}

export function deductMealFromInventory(
  inventory: InventoryItem[],
  meal: Meal
): InventoryItem[] {
  let next = inventory;
  for (const ingredient of meal.ingredients) {
    next = deductIngredientFromInventory(next, ingredient);
  }
  return next;
}

export function applyInventoryUpdates(
  inventory: InventoryItem[],
  updates: InventoryUpdate[]
): InventoryItem[] {
  let next = inventory;
  for (const update of updates) {
    next = deductIngredientFromInventory(
      next,
      update.name,
      update.amountUsed,
      update.unit
    );
  }
  return next;
}

/** Reconcile inventory, shopping list, and saved meals after any pantry change. */
export function syncPantryState(state: AppState, savedMeals?: Meal[]): AppState {
  const meals = savedMeals ?? state.meals.filter((m) =>
    state.savedMealIds.includes(m.id)
  );
  const requirements = computePantryRequirements(state.inventory, meals);
  const shoppingList = syncShoppingListForPantry(
    state.shoppingList,
    requirements
  );

  return {
    ...state,
    shoppingList,
  };
}

export function prepMeal(state: AppState, mealId: string): AppState {
  const meal = state.meals.find((m) => m.id === mealId);
  if (!meal) return state;

  const inventory = deductMealFromInventory(state.inventory, meal);
  return syncPantryState({ ...state, inventory });
}

export function getPantrySummary(requirements: PantryRequirement[]) {
  const missing = requirements.filter((r) => r.status === "missing").length;
  const low = requirements.filter((r) => r.status === "low").length;
  const inStock = requirements.filter((r) => r.status === "in_stock").length;
  return { missing, low, inStock, total: requirements.length };
}
