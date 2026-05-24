import { getSavedMeals } from "@/lib/meal/mealHelpers";
import { mealToTags } from "@/lib/ai/mealSummaries";
import {
  addMultipleToShoppingList,
  addSingleToShoppingList,
  removeShoppingItemByName,
} from "@/lib/shoppingListHelpers";
import type {
  AppState,
  ChatAction,
  AdaptedRecipe,
  GeneratedMealPlan,
  SharedIngredientsStrategy,
  ShoppingCategory,
  SuggestedShoppingItem,
} from "@/lib/types";

export {
  addCookingConfirmationMessage,
  buildCookingConfirmRows,
  confirmCookedRecipe,
  enrichRecipeWithInventory,
  markRecipeCooked,
  matchRecipeIngredientToInventory,
  subtractInventoryAmount,
} from "@/lib/cookingStateActions";

export interface ActionResult {
  state: AppState;
  confirmation: string;
  /** When set, ChatInterface should trigger a new AI call with this instruction */
  aiRevisionInstruction?: string;
}

function mapSuggestedItems(items: unknown[]): SuggestedShoppingItem[] {
  return items
    .filter((item) => item && typeof item === "object" && (item as { name?: string }).name?.trim())
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        name: String(row.name ?? "").trim(),
        amount: String(row.amount ?? "1").trim(),
        unit: String(row.unit ?? "").trim(),
        amountNeeded: row.amountNeeded
          ? String(row.amountNeeded).trim()
          : String(row.amount ?? "1").trim(),
        unitNeeded: row.unitNeeded
          ? String(row.unitNeeded).trim()
          : String(row.unit ?? "").trim(),
        category: (row.category as ShoppingCategory) ?? "Other",
        required: row.required !== false,
        reason: row.reason ? String(row.reason) : undefined,
        sourceMealId: row.sourceMealId ? String(row.sourceMealId) : undefined,
        sourceMealIds: Array.isArray(row.sourceMealIds)
          ? row.sourceMealIds.map(String)
          : undefined,
        usedInRecipes: Array.isArray(row.usedInRecipes)
          ? row.usedInRecipes.map(String)
          : undefined,
        source: "ai" as const,
      };
    });
}

function applyShoppingUpdatesFromPayload(
  state: AppState,
  payload: Record<string, unknown>
): AppState {
  const raw =
    Array.isArray(payload.shoppingListUpdates) ? payload.shoppingListUpdates
    : Array.isArray(payload.items) ? payload.items
    : [];
  if (!raw.length) return state;
  const { list } = addMultipleToShoppingList(state.shoppingList, mapSuggestedItems(raw));
  return { ...state, shoppingList: list };
}

function saveMealPlan(
  state: AppState,
  mealPlan: GeneratedMealPlan,
  strategy?: SharedIngredientsStrategy
): AppState {
  return {
    ...state,
    generatedMealPlan: {
      ...mealPlan,
      sharedIngredientsStrategy:
        strategy ?? mealPlan.sharedIngredientsStrategy ?? state.generatedMealPlan?.sharedIngredientsStrategy,
      updatedAt: new Date().toISOString(),
    },
  };
}

function applySubstitute(
  state: AppState,
  payload: Record<string, unknown>
): AppState {
  const mealTitle = String(payload.mealTitle ?? "");
  const original = String(payload.originalIngredient ?? "").toLowerCase();
  const substitute = String(payload.substituteIngredient ?? "");
  const plan = state.generatedMealPlan;

  if (!plan?.recipes?.length) {
    return {
      ...state,
      generatedMealPlan: {
        recipes: [
          {
            title: mealTitle || "Adapted meal",
            ingredients: substitute
              ? [{ name: substitute, amount: "1", unit: "serving", source: "inventory" }]
              : [],
            steps: [`Use ${substitute} instead of ${original}.`],
          },
        ],
        userDecisions: [`Use ${substitute} instead of ${original}`],
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const recipes: AdaptedRecipe[] = plan.recipes.map((recipe) => {
    if (mealTitle && recipe.title !== mealTitle) return recipe;
    return {
      ...recipe,
      ingredients: recipe.ingredients?.map((ing) =>
        ing.name.toLowerCase().includes(original)
          ? { ...ing, name: substitute, source: "inventory" as const }
          : ing
      ),
      missingIngredients: recipe.missingIngredients?.filter(
        (m) => !m.toLowerCase().includes(original)
      ),
    };
  });

  return {
    ...state,
    generatedMealPlan: {
      ...plan,
      recipes,
      userDecisions: [
        ...(plan.userDecisions ?? []),
        `Use ${substitute} instead of ${original}`,
      ],
      updatedAt: new Date().toISOString(),
    },
  };
}

export function applyAIAction(state: AppState, action: ChatAction): ActionResult {
  const { type, payload } = action;

  switch (type) {
    case "add_to_shopping_list": {
      const { list, added } = addSingleToShoppingList(state.shoppingList, {
        name: String(payload.name ?? ""),
        amount: String(payload.amount ?? "1"),
        unit: String(payload.unit ?? ""),
        amountNeeded: payload.amountNeeded
          ? String(payload.amountNeeded)
          : String(payload.amount ?? "1"),
        unitNeeded: payload.unitNeeded
          ? String(payload.unitNeeded)
          : String(payload.unit ?? ""),
        category: (payload.category as ShoppingCategory) ?? "Other",
        required: payload.required !== false,
        reason: payload.reason ? String(payload.reason) : undefined,
        sourceMealId: payload.sourceMealId ? String(payload.sourceMealId) : undefined,
        sourceMealIds: Array.isArray(payload.sourceMealIds)
          ? payload.sourceMealIds.map(String)
          : undefined,
        usedInRecipes: Array.isArray(payload.usedInRecipes)
          ? payload.usedInRecipes.map(String)
          : undefined,
        source: "ai",
      });
      const name = String(payload.name ?? "item");
      return {
        state: { ...state, shoppingList: list },
        confirmation: added
          ? `Added ${name} to your shopping list.`
          : `${name} is already on your shopping list (amount updated if possible).`,
      };
    }

    case "add_multiple_to_shopping_list": {
      const items = Array.isArray(payload.items) ? payload.items : [];
      const { list, added } = addMultipleToShoppingList(
        state.shoppingList,
        items.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            name: String(row.name ?? ""),
            amount: String(row.amount ?? "1"),
            unit: String(row.unit ?? ""),
            amountNeeded: row.amountNeeded
              ? String(row.amountNeeded)
              : String(row.amount ?? "1"),
            unitNeeded: row.unitNeeded
              ? String(row.unitNeeded)
              : String(row.unit ?? ""),
            category: (row.category as ShoppingCategory) ?? "Other",
            required: row.required !== false,
            reason: row.reason ? String(row.reason) : undefined,
            sourceMealId: row.sourceMealId ? String(row.sourceMealId) : undefined,
            sourceMealIds: Array.isArray(row.sourceMealIds)
              ? row.sourceMealIds.map(String)
              : undefined,
            usedInRecipes: Array.isArray(row.usedInRecipes)
              ? row.usedInRecipes.map(String)
              : undefined,
            source: "ai" as const,
          };
        })
      );
      return {
        state: { ...state, shoppingList: list },
        confirmation:
          added > 0
            ? `Added ${added} item${added === 1 ? "" : "s"} to your shopping list.`
            : "Those items are already on your shopping list.",
      };
    }

    case "use_substitute": {
      const substitute = String(payload.substituteIngredient ?? "substitute");
      const original = String(payload.originalIngredient ?? "ingredient");
      return {
        state: applySubstitute(state, payload),
        confirmation: `Got it — I'll use ${substitute} instead of ${original}.`,
      };
    }

    case "remove_optional_ingredient": {
      const name = String(payload.name ?? "");
      const { list, removed } = removeShoppingItemByName(state.shoppingList, name, {
        optionalOnly: true,
      });
      return {
        state: { ...state, shoppingList: list },
        confirmation: removed
          ? `Removed ${name} from your shopping list.`
          : `${name} wasn't on your list as an optional item.`,
      };
    }

    case "request_ai_revision": {
      const instruction = String(payload.instruction ?? "Revise the meal plan.");
      return {
        state,
        confirmation: "Working on that…",
        aiRevisionInstruction: instruction,
      };
    }

    case "pick_alternative_meal": {
      const tag = String(payload.tag ?? payload.reason ?? "").toLowerCase();
      const saved = getSavedMeals(state);
      const matches = saved.filter((meal) =>
        mealToTags(meal).some((t) => t.toLowerCase().includes(tag))
      );
      const names = (matches.length ? matches : saved)
        .slice(0, 3)
        .map((m) => m.name)
        .join(", ");
      return {
        state,
        confirmation: names
          ? `From your saved cards, try: ${names}. Ask me to build a plan from one of these.`
          : "Save a few meals on Discover first, then I can suggest alternatives.",
      };
    }

    case "accept_meal_plan": {
      const mealPlan = payload.mealPlan as GeneratedMealPlan | undefined;
      if (!mealPlan?.recipes?.length) {
        return { state, confirmation: "No meal plan to accept yet." };
      }
      let next = saveMealPlan(state, mealPlan);
      next = applyShoppingUpdatesFromPayload(next, payload);
      return {
        state: next,
        confirmation: `Saved your meal plan with ${mealPlan.recipes.length} recipe${mealPlan.recipes.length === 1 ? "" : "s"}.`,
      };
    }

    case "accept_simplified_plan": {
      const mealPlan = payload.mealPlan as GeneratedMealPlan | undefined;
      const strategy = payload.sharedIngredientsStrategy as SharedIngredientsStrategy | undefined;
      if (!mealPlan?.recipes?.length) {
        return { state, confirmation: "No simplified plan to accept yet." };
      }
      let next = saveMealPlan(state, mealPlan, strategy);
      next = applyShoppingUpdatesFromPayload(next, payload);
      const reused = strategy?.reusedIngredients?.length ?? 0;
      return {
        state: next,
        confirmation:
          reused > 0
            ? `Saved your simplified plan — ${reused} shared ingredient${reused === 1 ? "" : "s"} across meals. Shopping list updated.`
            : `Saved your meal plan with ${mealPlan.recipes.length} recipes. Shopping list updated.`,
      };
    }

    case "keep_original_plan": {
      const originalMealPlan = payload.originalMealPlan as GeneratedMealPlan | undefined;
      if (!originalMealPlan?.recipes?.length) {
        return {
          state,
          confirmation: "Keeping the original ingredient choices from the recipes shown.",
        };
      }
      return {
        state: saveMealPlan(state, originalMealPlan),
        confirmation: "Kept the original ingredients — no consolidation applied.",
      };
    }

    case "request_another_simplification": {
      const instruction = String(
        payload.instruction ??
          "Suggest another ingredient consolidation option that still preserves meal variety."
      );
      return {
        state,
        confirmation: "Looking for another simplification option…",
        aiRevisionInstruction: instruction,
      };
    }

    case "approve_core_change": {
      const mealId = String(payload.mealId ?? "");
      const mealTitle = String(payload.mealTitle ?? "");
      const originalCore = String(payload.originalCoreIngredient ?? "");
      const newCore = String(payload.newCoreIngredient ?? "");
      const plan = state.generatedMealPlan;
      if (!plan?.recipes?.length) {
        return {
          state,
          confirmation: `Approved — use ${newCore || "substitute"} instead of ${originalCore || "original"}.`,
        };
      }
      const recipes = plan.recipes.map((recipe) => {
        const matches =
          (mealId && recipe.basedOnMealCardId === mealId) ||
          (mealTitle && recipe.title === mealTitle);
        if (!matches) return recipe;
        return {
          ...recipe,
          displayTitle: recipe.displayTitle ?? `${recipe.title} (${newCore} swap)`,
          ingredients: recipe.ingredients?.map((ing) =>
            ing.name.toLowerCase().includes(originalCore.toLowerCase())
              ? {
                  ...ing,
                  name: newCore,
                  isSubstituted: true,
                  originalIngredient: ing.name,
                }
              : ing
          ),
          missingIngredients: recipe.missingIngredients?.filter(
            (m) => !m.toLowerCase().includes(originalCore.toLowerCase())
          ),
        };
      });
      return {
        state: {
          ...state,
          generatedMealPlan: {
            ...plan,
            recipes,
            userDecisions: [
              ...(plan.userDecisions ?? []),
              `Approved core change: ${newCore} instead of ${originalCore}`,
            ],
            updatedAt: new Date().toISOString(),
          },
        },
        confirmation: `Approved — ${newCore} replaces ${originalCore} in ${mealTitle || "that meal"}.`,
      };
    }

    case "reject_core_change": {
      const mealTitle = String(payload.mealTitle ?? "that meal");
      const originalCore = String(payload.originalCoreIngredient ?? "original ingredient");
      const plan = state.generatedMealPlan;
      return {
        state: plan
          ? {
              ...state,
              generatedMealPlan: {
                ...plan,
                userDecisions: [
                  ...(plan.userDecisions ?? []),
                  `Kept ${originalCore} in ${mealTitle}`,
                ],
                updatedAt: new Date().toISOString(),
              },
            }
          : state,
        confirmation: `Got it — keeping ${originalCore} for ${mealTitle}.`,
      };
    }

    case "replace_meal_for_simpler_ingredients": {
      const originalMealId = String(payload.originalMealId ?? "");
      const suggested = payload.suggestedMeal as AdaptedRecipe | undefined;
      const reason = String(payload.reason ?? "fewer unique ingredients");
      const plan = state.generatedMealPlan;
      if (!plan?.recipes?.length || !suggested?.title) {
        return { state, confirmation: "No replacement meal suggested yet." };
      }
      const recipes = plan.recipes.map((recipe) =>
        recipe.basedOnMealCardId === originalMealId || recipe.title === originalMealId
          ? { ...suggested, basedOnMealCardId: suggested.basedOnMealCardId ?? originalMealId }
          : recipe
      );
      return {
        state: {
          ...state,
          generatedMealPlan: {
            ...plan,
            recipes,
            userDecisions: [
              ...(plan.userDecisions ?? []),
              `Replaced meal for simpler ingredients: ${reason}`,
            ],
            updatedAt: new Date().toISOString(),
          },
        },
        confirmation: `Swapped in ${suggested.title} to reduce unique ingredients.`,
      };
    }

    case "keep_meal_despite_extra_ingredients": {
      const mealId = String(payload.mealId ?? "");
      const plan = state.generatedMealPlan;
      const mealTitle =
        plan?.recipes?.find((r) => r.basedOnMealCardId === mealId)?.title ?? "that meal";
      return {
        state: plan
          ? {
              ...state,
              generatedMealPlan: {
                ...plan,
                userDecisions: [
                  ...(plan.userDecisions ?? []),
                  `Kept ${mealTitle} despite extra ingredients`,
                ],
                updatedAt: new Date().toISOString(),
              },
            }
          : state,
        confirmation: `Keeping ${mealTitle} in your plan.`,
      };
    }

    case "save_generated_recipe":
      return {
        state,
        confirmation: "Saving generated recipes to Mealdeck will come in a future update.",
      };

    default:
      return { state, confirmation: "Action completed." };
  }
}

export function setGeneratedMealPlan(
  state: AppState,
  plan: GeneratedMealPlan | null
): AppState {
  return { ...state, generatedMealPlan: plan };
}

export {
  addCartToInventory,
  applyIngredientSubstitution,
  createInventoryItemFromCart,
  getCartItems,
  markShoppingItemInCart,
  mergeInventoryItem,
  removeAffectedMealsFromCurrentPlan,
  removeShoppingListItem,
  requestIngredientSubstitutionContext,
  unmarkShoppingItemInCart,
} from "./shoppingStateActions";

export {
  addInventoryItemFromScanner,
  confirmShoppingListMatch,
  findMatchingShoppingListItem,
  reduceShoppingListItemAmount,
  syncScannerItemWithShoppingList,
} from "./scannerShoppingSync";
