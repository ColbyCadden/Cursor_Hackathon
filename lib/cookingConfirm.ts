import { createId } from "./id";
import { getDefaultForIngredient } from "./ingredientDefaults";
import {
  findInventoryMatch,
  ingredientsMatch,
} from "./inventoryMatching";
import { syncPantryState } from "./pantrySync";
import type {
  AdaptedRecipe,
  AdaptedRecipeIngredient,
  AppState,
  ChatMessage,
  InventoryItem,
} from "./types";

export interface CookingConfirmRow {
  ingredientId: string;
  name: string;
  plannedAmount: string;
  plannedUnit: string;
  usedAmount: string;
  usedUnit: string;
  inventoryItemId?: string;
  inventoryName?: string;
  inventoryAmount?: string;
  inventoryUnit?: string;
  subtract: boolean;
  inInventory: boolean;
  unitMismatch: boolean;
  /** When recipe unit differs but we can auto-convert to pantry units */
  autoConvert?: boolean;
  convertedPreview?: string;
}

export interface UsedIngredientConfirmation {
  ingredientId: string;
  inventoryItemId?: string;
  name: string;
  usedAmount: string;
  usedUnit: string;
  subtract: boolean;
}

function parseAmount(amount: string): number | null {
  const raw = String(amount).trim();
  if (!raw) return null;

  const fraction = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const num = parseFloat(fraction[1]);
    const den = parseFloat(fraction[2]);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return num / den;
    }
  }

  const n = parseFloat(raw.replace(/[^\d./]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  if (u === "cups" || u === "cup") return "cup";
  if (u === "fl oz" || u === "floz") return "oz";
  return u;
}

export function unitsAreCompatible(a: string, b: string): boolean {
  const u = normUnit(a);
  const v = normUnit(b);
  if (u === v) return true;
  if ((u === "g" && v === "kg") || (u === "kg" && v === "g")) return true;
  if ((u === "oz" && v === "lb") || (u === "lb" && v === "oz")) return true;
  if ((u === "cup" && v === "oz") || (u === "oz" && v === "cup")) return true;
  return false;
}

/** Convert amount from one unit to another (simple pairs only). */
export function convertAmount(
  value: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const from = normUnit(fromUnit);
  const to = normUnit(toUnit);
  if (from === to) return value;
  if (from === "g" && to === "kg") return value / 1000;
  if (from === "kg" && to === "g") return value * 1000;
  if (from === "oz" && to === "lb") return value / 16;
  if (from === "lb" && to === "oz") return value * 16;
  // US volume: 1 cup ≈ 8 oz (yogurt, milk, etc.)
  if (from === "cup" && to === "oz") return value * 8;
  if (from === "oz" && to === "cup") return value / 8;
  return null;
}

export function matchRecipeIngredientToInventory(
  inventory: InventoryItem[],
  ingredient: AdaptedRecipeIngredient
): InventoryItem | undefined {
  if (ingredient.inventoryItemId) {
    const exact = inventory.find((i) => i.id === ingredient.inventoryItemId);
    if (exact) return exact;
  }
  const byName = inventory.find((i) =>
    ingredientsMatch(i.name, ingredient.name)
  );
  if (byName) return byName;
  return findInventoryMatch(inventory, ingredient.name);
}

export function enrichRecipeWithInventory(
  recipe: AdaptedRecipe,
  inventory: InventoryItem[]
): AdaptedRecipe {
  const baseIngredients =
    recipe.ingredients?.length ?
      recipe.ingredients
    : synthesizeIngredientsFromRecipe(recipe, inventory);

  const ingredients = baseIngredients.map((ing) => {
    const match = matchRecipeIngredientToInventory(inventory, ing);
    return {
      ...ing,
      id: ing.id ?? createId("ing"),
      inventoryItemId: match?.id ?? ing.inventoryItemId,
      availableAmount: match?.amount ?? ing.availableAmount,
      availableUnit: match?.unit ?? ing.availableUnit,
      isAvailableInInventory: Boolean(match),
      source:
        ing.source ??
        (match ? ("inventory" as const) : ("unknown" as const)),
    };
  });

  return {
    ...recipe,
    id: recipe.id ?? createId("recipe"),
    ingredients,
  };
}

function synthesizeIngredientsFromRecipe(
  recipe: AdaptedRecipe,
  inventory: InventoryItem[]
): AdaptedRecipeIngredient[] {
  const names = new Set<string>();
  for (const n of recipe.usesInventory ?? []) names.add(n);
  for (const n of recipe.missingIngredients ?? []) names.add(n);

  if (names.size === 0 && recipe.steps?.length) {
    for (const inv of inventory.slice(0, 4)) names.add(inv.name);
  }

  return Array.from(names).map((name) => {
    const defaults = getDefaultForIngredient(name);
    const match = findInventoryMatch(inventory, name);
    const fromInventory = recipe.usesInventory?.some((u) =>
      ingredientsMatch(u, name)
    );
    return {
      id: createId("ing"),
      name,
      amount: defaults.amount,
      unit: defaults.unit,
      source: fromInventory && match ? "inventory" : "missing",
      inventoryItemId: match?.id,
      availableAmount: match?.amount,
      availableUnit: match?.unit,
      isAvailableInInventory: Boolean(match),
    };
  });
}

export function buildCookingConfirmRows(
  recipe: AdaptedRecipe,
  inventory: InventoryItem[]
): CookingConfirmRow[] {
  const enriched = enrichRecipeWithInventory(recipe, inventory);
  const ingredients = enriched.ingredients ?? [];

  return ingredients.map((ing) => {
    const match = matchRecipeIngredientToInventory(inventory, ing);
    const plannedUnit = ing.unit || "serving";
    const invUnit = match?.unit ?? "";
    const usedAmount = ing.usedAmount ?? ing.amount ?? "1";
    const usedUnit = ing.usedUnit ?? ing.unit ?? "serving";
    const usedNum = parseAmount(usedAmount);
    const canAutoConvert =
      Boolean(match) &&
      usedNum !== null &&
      normUnit(usedUnit) !== normUnit(invUnit) &&
      convertAmount(usedNum, usedUnit, invUnit) !== null;
    const unitMismatch =
      Boolean(match) &&
      !unitsAreCompatible(plannedUnit, invUnit) &&
      normUnit(plannedUnit) !== normUnit(invUnit) &&
      !canAutoConvert;

    let convertedPreview: string | undefined;
    if (canAutoConvert && usedNum !== null && invUnit) {
      const converted = convertAmount(usedNum, usedUnit, invUnit);
      if (converted !== null) {
        convertedPreview = `≈ ${converted % 1 === 0 ? converted : converted.toFixed(1)} ${invUnit} from pantry`;
      }
    }

    return {
      ingredientId: ing.id ?? createId("ing"),
      name: ing.name,
      plannedAmount: ing.amount || "1",
      plannedUnit,
      usedAmount,
      usedUnit,
      inventoryItemId: match?.id,
      inventoryName: match?.name,
      inventoryAmount: match?.amount,
      inventoryUnit: match?.unit,
      subtract: Boolean(match) && !unitMismatch,
      inInventory: Boolean(match),
      unitMismatch,
      autoConvert: canAutoConvert,
      convertedPreview,
    };
  });
}

export function subtractInventoryAmount(
  inventory: InventoryItem[],
  inventoryItemId: string,
  amountUsed: string,
  unitUsed: string
): { inventory: InventoryItem[]; deducted: number; unit: string } {
  const item = inventory.find((i) => i.id === inventoryItemId);
  if (!item) return { inventory, deducted: 0, unit: unitUsed };

  const usedNum = parseAmount(amountUsed);
  const currentNum = parseAmount(item.amount);

  if (usedNum === null || currentNum === null) {
    const next = inventory.map((row) =>
      row.id === inventoryItemId
        ? {
            ...row,
            portionsLeft: Math.max(0, row.portionsLeft - 1),
          }
        : row
    );
    return { inventory: next, deducted: 1, unit: item.unit };
  }

  let subtractInItemUnits = usedNum;
  const itemUnit = normUnit(item.unit);
  const usedUnit = normUnit(unitUsed);

  if (itemUnit !== usedUnit) {
    const converted = convertAmount(usedNum, usedUnit, item.unit);
    if (converted !== null) subtractInItemUnits = converted;
  }

  const newAmount = Math.max(0, currentNum - subtractInItemUnits);
  const ratio =
    currentNum > 0 ? subtractInItemUnits / currentNum : 1;
  const portionsUsed = Math.max(
    0,
    Math.min(item.portionsLeft, Math.round(item.portionsLeft * ratio) || 1)
  );

  const next = inventory.map((row) =>
    row.id === inventoryItemId
      ? {
          ...row,
          amount: String(newAmount),
          portionsLeft: Math.max(0, row.portionsLeft - portionsUsed),
        }
      : row
  );

  return {
    inventory: next,
    deducted: subtractInItemUnits,
    unit: item.unit,
  };
}

export function getAvailableInInventoryUnits(
  inventoryItem: InventoryItem,
  usedUnit: string
): number | null {
  const current = parseAmount(inventoryItem.amount);
  if (current === null) return null;
  if (unitsAreCompatible(inventoryItem.unit, usedUnit)) {
    if (normUnit(inventoryItem.unit) === normUnit(usedUnit)) return current;
    return convertAmount(current, inventoryItem.unit, usedUnit);
  }
  return null;
}

export function recipeKey(messageId: string, index: number, recipe: AdaptedRecipe): string {
  return `${messageId}:${index}:${recipe.id ?? recipe.title}`;
}

export function markRecipeCooked(
  state: AppState,
  recipe: AdaptedRecipe
): AppState {
  const cookedAt = new Date().toISOString();
  const markOne = (r: AdaptedRecipe): AdaptedRecipe =>
    r.id === recipe.id || r.title === recipe.title
      ? { ...r, cooked: true, cookedAt }
      : r;

  const chatMessages = state.chatMessages.map((msg) => ({
    ...msg,
    recipes: msg.recipes?.map(markOne),
  }));

  const generatedMealPlan = state.generatedMealPlan
    ? {
        ...state.generatedMealPlan,
        recipes: state.generatedMealPlan.recipes.map(markOne),
        updatedAt: cookedAt,
      }
    : state.generatedMealPlan;

  return { ...state, chatMessages, generatedMealPlan };
}

export function addCookingConfirmationMessage(
  state: AppState,
  recipeTitle: string
): AppState {
  const confirmation: ChatMessage = {
    id: createId("chat"),
    role: "assistant",
    content: `Nice — I updated your pantry for ${recipeTitle}.`,
    createdAt: new Date().toISOString(),
  };
  return {
    ...state,
    chatMessages: [...state.chatMessages, confirmation],
  };
}

export function confirmCookedRecipe(
  state: AppState,
  recipe: AdaptedRecipe,
  usedIngredients: UsedIngredientConfirmation[],
  options?: {
    messageId?: string;
    recipeIndex?: number;
  }
): AppState {
  let inventory = state.inventory;

  for (const row of usedIngredients) {
    if (!row.subtract || !row.inventoryItemId) continue;
    const result = subtractInventoryAmount(
      inventory,
      row.inventoryItemId,
      row.usedAmount,
      row.usedUnit
    );
    inventory = result.inventory;
  }

  let next: AppState = syncPantryState({ ...state, inventory });
  next = markRecipeCooked(next, recipe);
  next = addCookingConfirmationMessage(next, recipe.displayTitle ?? recipe.title);

  if (options?.messageId != null && options.recipeIndex != null) {
    const key = recipeKey(options.messageId, options.recipeIndex, recipe);
    const alreadyCooked = state.chatMessages
      .find((msg) => msg.id === options.messageId)
      ?.cookedRecipeKeys?.includes(key);

    next = {
      ...next,
      chatMessages: next.chatMessages.map((msg) =>
        msg.id === options.messageId
          ? {
              ...msg,
              cookedRecipeKeys: [...(msg.cookedRecipeKeys ?? []), key],
            }
          : msg
      ),
      recipesCreated:
        alreadyCooked ?
          (state.recipesCreated ?? 0)
        : (state.recipesCreated ?? 0) + 1,
    };
  } else {
    next = {
      ...next,
      recipesCreated: (state.recipesCreated ?? 0) + 1,
    };
  }

  return next;
}
