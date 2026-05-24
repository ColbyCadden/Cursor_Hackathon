import { getDefaultForIngredient } from "./ingredientDefaults";
import { normalizeIngredientName } from "./inventoryMatching";
import { removeShoppingListItemById } from "./shoppingListHelpers";
import { syncPantryState } from "./pantrySync";
import type {
  AdaptedRecipe,
  AppState,
  CartBoughtData,
  IngredientSubstitution,
  ShoppingListItem,
  UserProfile,
} from "./types";

const CORE_PATTERNS = [
  /\bchicken\b/,
  /\bbeef\b/,
  /\bpork\b/,
  /\bturkey\b/,
  /\bsalmon\b/,
  /\btuna\b/,
  /\bshrimp\b/,
  /\btofu\b/,
  /\brice\b/,
  /\bpasta\b/,
  /\bnoodle/,
  /\btortilla\b/,
  /\bbroccoli\b/,
  /\bspinach\b/,
  /\bquinoa\b/,
  /\bpotato\b/,
];

const NON_CORE_PATTERNS = [
  /\boil\b/,
  /\bsalt\b/,
  /\bpepper\b/,
  /\bgarlic\b/,
  /\bginger\b/,
  /\bsauce\b/,
  /\bseasoning\b/,
];

export function isCoreIngredient(name: string): boolean {
  const normalized = normalizeIngredientName(name);
  if (NON_CORE_PATTERNS.some((p) => p.test(normalized))) return false;
  return CORE_PATTERNS.some((p) => p.test(normalized));
}

const LOCAL_SUBSTITUTES: Record<string, string[]> = {
  chicken: ["pork", "turkey", "tofu", "beef", "chickpeas"],
  "chicken breast": ["pork", "turkey", "tofu", "beef"],
  pork: ["chicken", "turkey", "tofu", "beef"],
  beef: ["pork", "chicken", "turkey", "tofu"],
  turkey: ["chicken", "pork", "tofu"],
  tofu: ["chickpeas", "chicken", "turkey"],
  rice: ["quinoa", "noodles", "potatoes", "tortillas"],
  pasta: ["rice", "noodles", "potatoes"],
  "greek yogurt": ["cottage cheese", "regular yogurt"],
  yogurt: ["cottage cheese", "regular yogurt"],
  broccoli: ["spinach", "peas", "mixed vegetables"],
  spinach: ["broccoli", "mixed greens", "kale"],
  "olive oil": ["vegetable oil", "canola oil"],
};

export function getLocalSubstituteSuggestions(
  ingredientName: string,
  inventory: AppState["inventory"],
  profile: UserProfile
): string[] {
  const key = normalizeIngredientName(ingredientName);
  const base =
    LOCAL_SUBSTITUTES[key] ??
    Object.entries(LOCAL_SUBSTITUTES).find(([k]) => key.includes(k))?.[1] ??
    [];

  const avoided = new Set(
    (profile.avoidedFoods ?? []).map((f) => normalizeIngredientName(f))
  );

  const fromInventory = inventory
    .filter((i) => i.portionsLeft > 0)
    .map((i) => i.name)
    .filter((name) => !avoided.has(normalizeIngredientName(name)));

  const combined = [...new Set([...base, ...fromInventory.slice(0, 2)])]
    .filter((s) => normalizeIngredientName(s) !== key)
    .filter((s) => !avoided.has(normalizeIngredientName(s)));

  return combined.slice(0, 4);
}

export function recipeUsesIngredient(
  recipe: AdaptedRecipe,
  ingredientName: string
): boolean {
  const needle = normalizeIngredientName(ingredientName);
  if (
    recipe.missingIngredients?.some((m) =>
      normalizeIngredientName(m).includes(needle)
    )
  ) {
    return true;
  }
  return (
    recipe.ingredients?.some((ing) =>
      normalizeIngredientName(ing.name).includes(needle)
    ) ?? false
  );
}

function applyRecipeSubstitution(
  recipe: AdaptedRecipe,
  original: string,
  substitute: string
): AdaptedRecipe {
  const core = isCoreIngredient(original);
  const originalTitle = recipe.originalTitle ?? recipe.title;
  const sub: IngredientSubstitution = {
    original,
    substitute,
    core,
    note: core ? undefined : `Using ${substitute} instead of ${original}.`,
  };

  const updatedIngredients = recipe.ingredients?.map((ing) =>
    normalizeIngredientName(ing.name).includes(normalizeIngredientName(original))
      ? { ...ing, name: substitute, source: "inventory" as const }
      : ing
  );

  const displayTitle = core
    ? `${originalTitle} (substituted with ${substitute})`
    : originalTitle;

  return {
    ...recipe,
    originalTitle,
    displayTitle,
    title: displayTitle,
    ingredients: updatedIngredients,
    missingIngredients: recipe.missingIngredients?.filter(
      (m) =>
        !normalizeIngredientName(m).includes(normalizeIngredientName(original))
    ),
    substitutions: [...(recipe.substitutions ?? []), sub],
    ingredientNotes: core
      ? recipe.ingredientNotes
      : [...(recipe.ingredientNotes ?? []), sub.note!],
  };
}

export function markShoppingItemInCart(
  state: AppState,
  itemId: string,
  boughtData: CartBoughtData
): AppState {
  const shoppingList = state.shoppingList.map((item) =>
    item.id === itemId
      ? {
          ...item,
          inCart: true,
          bought: true,
          ...boughtData,
        }
      : item
  );
  return { ...state, shoppingList };
}

export function unmarkShoppingItemInCart(
  state: AppState,
  itemId: string
): AppState {
  const shoppingList = state.shoppingList.map((item) =>
    item.id === itemId
      ? {
          ...item,
          inCart: false,
          bought: false,
          boughtAmount: undefined,
          boughtUnit: undefined,
          boughtEquivalentAmount: undefined,
          boughtEquivalentUnit: undefined,
        }
      : item
  );
  return { ...state, shoppingList };
}

export function removeShoppingListItem(state: AppState, itemId: string): AppState {
  return syncPantryState({
    ...state,
    shoppingList: removeShoppingListItemById(state.shoppingList, itemId),
  });
}

export function removeAffectedMealsFromCurrentPlan(
  state: AppState,
  itemId: string
): AppState {
  const item = state.shoppingList.find((i) => i.id === itemId);
  if (!item) return state;

  const ingredientName = item.name;
  const plan = state.generatedMealPlan;
  const recipes =
    plan?.recipes?.filter((r) => !recipeUsesIngredient(r, ingredientName)) ?? [];

  return syncPantryState({
    ...state,
    generatedMealPlan: plan
      ? {
          ...plan,
          recipes,
          userDecisions: [
            ...(plan.userDecisions ?? []),
            `Removed meals needing ${ingredientName} from current plan`,
          ],
          updatedAt: new Date().toISOString(),
        }
      : plan,
    shoppingList: removeShoppingListItemById(state.shoppingList, itemId),
  });
}

export function applyIngredientSubstitution(
  state: AppState,
  itemId: string,
  substitute: string
): AppState {
  const item = state.shoppingList.find((i) => i.id === itemId);
  if (!item) return state;

  const original = item.name;
  const defaults = getDefaultForIngredient(substitute);
  const plan = state.generatedMealPlan;

  const recipes = (plan?.recipes ?? []).map((recipe) =>
    recipeUsesIngredient(recipe, original)
      ? applyRecipeSubstitution(recipe, original, substitute)
      : recipe
  );

  const shoppingList = state.shoppingList.map((entry) =>
    entry.id === itemId
      ? {
          ...entry,
          name: substitute,
          category: defaults.category,
          reason: entry.reason
            ? entry.reason.replace(new RegExp(original, "i"), substitute)
            : `Substituted for ${original}`,
        }
      : entry
  );

  return syncPantryState({
    ...state,
    shoppingList,
    generatedMealPlan: plan
      ? {
          ...plan,
          recipes,
          userDecisions: [
            ...(plan.userDecisions ?? []),
            `Substituted ${substitute} for ${original}`,
          ],
          updatedAt: new Date().toISOString(),
        }
      : plan,
  });
}

export function getShoppingItemById(
  state: AppState,
  itemId: string
): ShoppingListItem | undefined {
  return state.shoppingList.find((i) => i.id === itemId);
}

export function requestIngredientSubstitutionContext(
  state: AppState,
  itemId: string
): {
  item: ShoppingListItem;
  affectedRecipes: string[];
  localSuggestions: string[];
} | null {
  const item = getShoppingItemById(state, itemId);
  if (!item) return null;

  const fromPlan = (state.generatedMealPlan?.recipes ?? [])
    .filter((r) => recipeUsesIngredient(r, item.name))
    .map((r) => r.displayTitle ?? r.title);

  const affectedRecipes =
    item.usedInRecipes?.length ? item.usedInRecipes : fromPlan;

  return {
    item,
    affectedRecipes,
    localSuggestions: getLocalSubstituteSuggestions(
      item.name,
      state.inventory,
      state.profile
    ),
  };
}

// Re-export cart/inventory helpers for appState API surface
export {
  addCartToInventory,
  createInventoryItemFromCart,
  mergeInventoryItem,
  getCartItems,
} from "./cartToInventory";
