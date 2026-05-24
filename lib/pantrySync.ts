import { deriveIngredientTags } from "./ingredientAliases";
import { getDefaultForIngredient } from "./ingredientDefaults";
import { createId } from "./id";
import {
  findInventoryMatch,
  ingredientsMatch,
  normalizeIngredientName,
} from "./inventoryMatching";
import { buildMealdexShoppingList } from "./meal/shoppingList";
import type {
  AppState,
  InventoryItem,
  InventoryUpdate,
  Meal,
  ShoppingListItem,
} from "./types";

export const LOW_STOCK_THRESHOLD = 25;

export type PantryStatus = "in_stock" | "low" | "missing";

export interface PantryRequirement {
  name: string;
  amountNeeded: string;
  unit: string;
  category: ShoppingListItem["category"];
  status: PantryStatus;
  percentLeft: number | null;
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
        percentLeft: null,
        matchedInventoryId: null,
        mealNames: item.mealNames,
        mealCount: item.count,
      };
    }

    const percentLeft = match.percentLeft;
    const status: PantryStatus =
      percentLeft <= LOW_STOCK_THRESHOLD ? "low" : "in_stock";

    return {
      name: item.name,
      amountNeeded,
      unit: defaults.unit,
      category: defaults.category,
      status,
      percentLeft,
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
      list.push({
        id: createId("shop"),
        name: req.name,
        amount: req.amountNeeded,
        unit: req.unit,
        category: req.category,
        required: true,
        bought: false,
        addedToInventory: false,
        source: "mealdex",
      });
      continue;
    }

    const existing = list[idx];
    if (existing.source === "mealdex" || existing.source === undefined) {
      list[idx] = {
        ...existing,
        amount: req.amountNeeded,
        unit: req.unit,
        category: req.category,
        source: existing.source ?? "mealdex",
      };
    }
  }

  return list;
}

export function deductIngredientFromInventory(
  inventory: InventoryItem[],
  ingredientName: string,
  amountUsed?: string,
  unit?: string
): InventoryItem[] {
  const match = findInventoryMatch(inventory, ingredientName);
  if (!match) return inventory;

  const defaults = getDefaultForIngredient(ingredientName);
  const usedAmount = amountUsed ?? defaults.amount;
  const usedNum = parseAmount(usedAmount);
  const currentNum = parseAmount(match.amount);

  if (usedNum !== null && currentNum !== null && currentNum > 0) {
    const newAmount = Math.max(0, currentNum - usedNum);
    const percentUsed = (usedNum / currentNum) * 100;
    const newPercent = Math.max(0, Math.round(match.percentLeft - percentUsed));

    return inventory.map((item) =>
      item.id === match.id
        ? {
            ...item,
            amount: String(newAmount),
            percentLeft: newPercent,
          }
        : item
    );
  }

  const percentPerUse = unit && match.unit && unit !== match.unit ? 20 : 25;
  return inventory.map((item) =>
    item.id === match.id
      ? {
          ...item,
          percentLeft: Math.max(0, item.percentLeft - percentPerUse),
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
