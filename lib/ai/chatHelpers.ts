import type { SavedMealSummary } from "@/lib/ai/mealSummaries";
import {
  mergeSuggestedShoppingItems,
  suggestedItemsFromRecipes,
} from "@/lib/suggestedItemsFromRecipes";
import {
  normalizeIngredientAmountUnit,
  sanitizeRecipeSteps,
  sanitizeStepList,
} from "@/lib/ai/recipeSanitize";
import type {
  AdaptedRecipe,
  BeforeAfterComparison,
  ChatAction,
  GeneratedMealPlan,
  InventoryCategory,
  InventoryItem,
  InventoryUpdate,
  SharedIngredientsStrategy,
  ShoppingListItem,
  SuggestedShoppingItem,
  UserProfile,
} from "@/lib/types";

export interface AIResponse {
  /** Primary reply text (alias: message) */
  text: string;
  suggestedItems?: SuggestedShoppingItem[];
  mealPrepSteps?: string[];
  inventoryUpdates?: InventoryUpdate[];
  source?: "gemini" | "groq" | "mock" | "quota" | "unconfigured" | "local";
  actions?: ChatAction[];
  recipes?: AdaptedRecipe[];
  mealPlan?: GeneratedMealPlan;
  shoppingListUpdates?: SuggestedShoppingItem[];
  sharedIngredientsStrategy?: SharedIngredientsStrategy;
  beforeAfterComparison?: BeforeAfterComparison;
  warnings?: string[];
  needsUserChoice?: boolean;
}

export interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequestBody {
  message: string;
  profile: UserProfile;
  inventory: InventoryItem[];
  shoppingList: ShoppingListItem[];
  savedMeals: SavedMealSummary[];
  recentMessages: ChatApiMessage[];
  generatedMealPlan?: GeneratedMealPlan | null;
}

export function buildChatContext(body: ChatRequestBody): string {
  const { profile, inventory, shoppingList, savedMeals, generatedMealPlan } = body;

  const goals = profile.eatingGoals?.length
    ? profile.eatingGoals.join(", ")
    : "general healthy eating";
  const avoided = profile.avoidedFoods?.filter((f) => f.toLowerCase() !== "none").join(", ") || "none";
  const equipment = (profile.appliances?.length ? profile.appliances : profile.cooking_equipment)?.join(", ") || "basic kitchen";

  const inventoryLine = inventory.length
    ? inventory
        .map(
          (i) =>
            `- ${i.name}: ${i.amount}${i.unit ? ` ${i.unit}` : ""} (${i.category}, ${i.portionsLeft} portion${i.portionsLeft === 1 ? "" : "s"} left)`
        )
        .join("\n")
    : "- (empty)";

  const shoppingLine = shoppingList.length
    ? shoppingList
        .map(
          (i) =>
            `- ${i.name}: ${i.amount}${i.unit ? ` ${i.unit}` : ""}${i.bought ? " [bought]" : ""}${i.required ? "" : " [optional]"}${i.reason ? ` — ${i.reason}` : ""}`
        )
        .join("\n")
    : "- (empty)";

  const mealdexLine = savedMeals.length
    ? savedMeals
        .map(
          (m) =>
            `- [${m.id}] ${m.name} (tags: ${m.tags.join(", ") || "none"}; difficulty ${m.difficulty}/5; ~${m.estimatedMinutes ?? "?"} min): ${m.ingredients.join(", ")}`
        )
        .join("\n")
    : "- (none saved yet — meal cards are flexible templates, not fixed recipes)";

  const planLine = generatedMealPlan?.recipes?.length
    ? generatedMealPlan.recipes
        .map(
          (r) =>
            `- ${r.title}${r.basedOnMealCardId ? ` (from card ${r.basedOnMealCardId})` : ""}: missing [${(r.missingIngredients ?? []).join(", ")}]`
        )
        .join("\n")
    : "- (no active meal plan)";

  return [
    `Student: ${profile.name}`,
    `Skill: ${profile.cookingSkill || profile.cooking_skill_level || "unknown"}`,
    `Goals: ${goals}`,
    `Time available: ${profile.availableTime || profile.cooking_time_per_week || "unknown"}`,
    `Simplicity: ${profile.simplicityPreference || "balanced"}`,
    `Avoided foods/allergies: ${avoided}`,
    `Appliances/equipment: ${equipment}`,
    "",
    "Kitchen pantry:",
    inventoryLine,
    "",
    "Shopping list:",
    shoppingLine,
    "",
    "Saved MealDeck cards (flexible templates — adapt but preserve core identity & tags):",
    mealdexLine,
    "",
    "Current generated meal plan:",
    planLine,
  ].join("\n");
}

const VALID_CATEGORIES = new Set<string>([
  "Protein",
  "Carbs",
  "Produce",
  "Fruit",
  "Dairy",
  "Snacks",
  "Sauces/Spices",
  "Frozen",
  "Other",
]);

const VALID_ACTION_TYPES = new Set<string>([
  "add_to_shopping_list",
  "add_multiple_to_shopping_list",
  "use_substitute",
  "remove_optional_ingredient",
  "request_ai_revision",
  "pick_alternative_meal",
  "accept_meal_plan",
  "save_generated_recipe",
  "accept_simplified_plan",
  "keep_original_plan",
  "request_another_simplification",
  "approve_core_change",
  "reject_core_change",
  "replace_meal_for_simpler_ingredients",
  "keep_meal_despite_extra_ingredients",
]);

function parseStringArray(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw.map((s) => String(s).trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function parseSharedIngredientsStrategy(raw: unknown): SharedIngredientsStrategy | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;

  const reusedIngredients = Array.isArray(row.reusedIngredients)
    ? row.reusedIngredients
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const ing = item as Record<string, unknown>;
          const usedInMeals = parseStringArray(ing.usedInMeals) ?? [];
          if (!String(ing.name ?? "").trim()) return null;
          return {
            name: String(ing.name).trim(),
            usedInMeals,
            reason: ing.reason ? String(ing.reason) : undefined,
          };
        })
        .filter(Boolean) as SharedIngredientsStrategy["reusedIngredients"]
    : undefined;

  const secondaryChanges = Array.isArray(row.secondaryChanges)
    ? row.secondaryChanges
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const change = item as Record<string, unknown>;
          if (!String(change.original ?? "").trim() || !String(change.replacement ?? "").trim()) {
            return null;
          }
          return {
            original: String(change.original).trim(),
            replacement: String(change.replacement).trim(),
            mealsAffected: parseStringArray(change.mealsAffected) ?? [],
            reason: change.reason ? String(change.reason) : undefined,
          };
        })
        .filter(Boolean) as SharedIngredientsStrategy["secondaryChanges"]
    : undefined;

  const coreChanges = Array.isArray(row.coreChanges)
    ? row.coreChanges
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const change = item as Record<string, unknown>;
          const mealTitle = change.mealTitle
            ? String(change.mealTitle)
            : change.originalMealCard
              ? String(change.originalMealCard)
              : undefined;
          const reason = change.reason
            ? String(change.reason)
            : change.change
              ? String(change.change)
              : undefined;
          return {
            mealTitle,
            mealId: change.mealId ? String(change.mealId) : undefined,
            originalCoreIngredient: change.originalCoreIngredient
              ? String(change.originalCoreIngredient)
              : undefined,
            newCoreIngredient: change.newCoreIngredient
              ? String(change.newCoreIngredient)
              : undefined,
            reason,
          };
        })
    : undefined;

  const strategy: SharedIngredientsStrategy = {
    summary: row.summary ? String(row.summary).trim() : undefined,
    reusedIngredients,
    preservedVariety: parseStringArray(row.preservedVariety),
    coreChanges,
    secondaryChanges,
  };

  if (
    !strategy.summary &&
    !strategy.reusedIngredients?.length &&
    !strategy.preservedVariety?.length &&
    !strategy.coreChanges?.length &&
    !strategy.secondaryChanges?.length
  ) {
    return undefined;
  }

  return strategy;
}

function parseBeforeAfterComparison(raw: unknown): BeforeAfterComparison | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const comparison: BeforeAfterComparison = {
    before: parseStringArray(row.before),
    after: parseStringArray(row.after),
    result: parseStringArray(row.result),
  };
  if (!comparison.before?.length && !comparison.after?.length && !comparison.result?.length) {
    return undefined;
  }
  return comparison;
}

function parseSuggestedItems(raw: unknown): SuggestedShoppingItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter((item) => item && typeof item === "object" && (item as { name?: string }).name?.trim())
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        name: String(row.name).trim(),
        amount: String(row.amount ?? "1").trim(),
        unit: String(row.unit ?? "").trim(),
        amountNeeded: row.amountNeeded
          ? String(row.amountNeeded).trim()
          : String(row.amount ?? "1").trim(),
        unitNeeded: row.unitNeeded
          ? String(row.unitNeeded).trim()
          : String(row.unit ?? "").trim(),
        category: VALID_CATEGORIES.has(String(row.category))
          ? (String(row.category) as InventoryCategory)
          : "Other",
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
  return items.length ? items : undefined;
}

function parseActions(raw: unknown): ChatAction[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const actions = raw
    .filter(
      (a) =>
        a &&
        typeof a === "object" &&
        typeof (a as ChatAction).label === "string" &&
        VALID_ACTION_TYPES.has(String((a as ChatAction).type))
    )
    .map((a) => {
      const action = a as ChatAction;
      return {
        label: action.label.trim(),
        type: action.type,
        payload: (action.payload ?? {}) as Record<string, unknown>,
      };
    });
  return actions.length ? actions : undefined;
}

function parseRecipeIngredients(raw: unknown): AdaptedRecipe["ingredients"] {
  if (!Array.isArray(raw)) return undefined;
  const ingredients = raw
    .filter((item) => item && typeof item === "object" && (item as { name?: string }).name?.trim())
    .map((item) => {
      const row = item as Record<string, unknown>;
      const source = String(row.source ?? "unknown");
      const validSource =
        source === "inventory" ||
        source === "shopping-list" ||
        source === "missing" ||
        source === "manual" ||
        source === "unknown"
          ? source
          : "unknown";
      return {
        id: row.id ? String(row.id) : undefined,
        name: String(row.name).trim(),
        ...normalizeIngredientAmountUnit(
          String(row.amount ?? "1").trim(),
          String(row.unit ?? "").trim()
        ),
        source: validSource as NonNullable<AdaptedRecipe["ingredients"]>[number]["source"],
        inventoryItemId: row.inventoryItemId ? String(row.inventoryItemId) : undefined,
        availableAmount: row.availableAmount ? String(row.availableAmount) : undefined,
        availableUnit: row.availableUnit ? String(row.availableUnit) : undefined,
        usedAmount: row.usedAmount ? String(row.usedAmount) : undefined,
        usedUnit: row.usedUnit ? String(row.usedUnit) : undefined,
        isAvailableInInventory: row.isAvailableInInventory === true,
        isSubstituted: row.isSubstituted === true,
        originalIngredient: row.originalIngredient
          ? String(row.originalIngredient)
          : undefined,
      };
    });
  return ingredients.length ? ingredients : undefined;
}

function parseRecipes(raw: unknown): AdaptedRecipe[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const recipes = raw
    .filter((r) => r && typeof r === "object" && (r as AdaptedRecipe).title?.trim())
    .map((r) => {
      const recipe = r as AdaptedRecipe;
      const base = {
        title: recipe.title.trim(),
        basedOnMealCardId: recipe.basedOnMealCardId,
        servings: recipe.servings,
        tags: recipe.tags,
        usesInventory: recipe.usesInventory,
        missingIngredients: recipe.missingIngredients,
        ingredients: parseRecipeIngredients(recipe.ingredients),
      };
      return {
        ...base,
        steps: sanitizeRecipeSteps(recipe.steps, base),
      };
    });
  return recipes.length ? recipes : undefined;
}

function parseMealPlan(raw: unknown): GeneratedMealPlan | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const plan = raw as GeneratedMealPlan;
  const recipes = parseRecipes(plan.recipes);
  if (!recipes?.length) return undefined;
  return {
    selectedMealIds: plan.selectedMealIds,
    recipes,
    servings: plan.servings,
    missingIngredients: plan.missingIngredients,
    userDecisions: plan.userDecisions,
    sharedIngredientsStrategy: parseSharedIngredientsStrategy(plan.sharedIngredientsStrategy),
  };
}

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .trim();
}

/** Pull message/text from broken or truncated JSON when JSON.parse fails. */
function extractMessageFromBrokenJson(raw: string): string | null {
  const fullMessage = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (fullMessage?.[1]) return unescapeJsonString(fullMessage[1]);

  const fullText = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (fullText?.[1]) return unescapeJsonString(fullText[1]);

  const truncated = raw.match(/"message"\s*:\s*"([\s\S]*)$/);
  if (truncated?.[1]) {
    const cleaned = truncated[1].replace(/\\n/g, "\n").replace(/["{}[\]]+$/, "").trim();
    if (cleaned.length > 10 && !looksLikeJsonPayload(cleaned)) return cleaned;
  }

  return null;
}

const JSON_PAYLOAD_MARKERS =
  /"message"\s*:|"text"\s*:|"recipes"\s*:|"sharedIngredientsStrategy"\s*:|"beforeAfterComparison"\s*:|"coreChanges"\s*:|"shoppingListUpdates"\s*:|"actions"\s*:/;

function looksLikeJsonPayload(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.startsWith("{") || t.startsWith("[") || /^[\],]/.test(t)) {
    return JSON_PAYLOAD_MARKERS.test(t);
  }
  return false;
}

function isReadableChatText(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 2) return false;
  return !looksLikeJsonPayload(t);
}

function hasStructuredPayload(parsed: Record<string, unknown>): boolean {
  return Boolean(
    parsed.recipes ||
      parsed.sharedIngredientsStrategy ||
      parsed.beforeAfterComparison ||
      parsed.actions ||
      parsed.shoppingListUpdates ||
      parsed.suggestedItems ||
      parsed.mealPlan
  );
}

function fallbackTextFromParsed(
  parsed: Record<string, unknown>,
  recipes?: AdaptedRecipe[]
): string {
  const strategy = parsed.sharedIngredientsStrategy as { summary?: string } | undefined;
  if (strategy?.summary?.trim()) {
    return strategy.summary.trim();
  }

  if (recipes?.length) {
    const titles = recipes
      .slice(0, 3)
      .map((r) => r.displayTitle ?? r.title)
      .join(", ");
    return `I put together ${recipes.length} recipe${recipes.length === 1 ? "" : "s"}${titles ? `: ${titles}` : ""}. Details are below.`;
  }

  if (hasStructuredPayload(parsed)) {
    return "Here's my suggestion — see the cards and actions below.";
  }

  return "I hit a formatting glitch — please try again or ask a shorter question.";
}

function resolveDisplayText(
  parsed: Record<string, unknown>,
  raw: string,
  recipes?: AdaptedRecipe[]
): string {
  const fromFields =
    (typeof parsed.message === "string" ? parsed.message.trim() : "") ||
    (typeof parsed.text === "string" ? parsed.text.trim() : "");

  if (isReadableChatText(fromFields)) {
    return fromFields;
  }

  const extracted = extractMessageFromBrokenJson(raw);
  if (extracted && isReadableChatText(extracted)) {
    return extracted;
  }

  if (looksLikeJsonPayload(raw) || looksLikeJsonPayload(fromFields)) {
    return fallbackTextFromParsed(parsed, recipes);
  }

  return fromFields || raw.trim();
}

/** Clean stored assistant text for display (handles legacy raw JSON messages). */
export function sanitizeChatDisplayText(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return content;

  if (!looksLikeJsonPayload(trimmed)) {
    return content;
  }

  const parsed = parseAIResponse(trimmed);
  if (isReadableChatText(parsed.text)) {
    return parsed.text;
  }

  return "Here's my suggestion — see the cards and actions below.";
}

function repairTruncatedJson(jsonSlice: string): string {
  let repaired = jsonSlice.trim();

  const quoteCount = (repaired.match(/(?<!\\)"/g) ?? []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }

  const openBrackets = (repaired.match(/\[/g) ?? []).length;
  const closeBrackets = (repaired.match(/]/g) ?? []).length;
  const openBraces = (repaired.match(/{/g) ?? []).length;
  const closeBraces = (repaired.match(/}/g) ?? []).length;

  repaired += "]".repeat(Math.max(0, openBrackets - closeBrackets));
  repaired += "}".repeat(Math.max(0, openBraces - closeBraces));

  return repaired;
}

function finalizeMessageText(text: string, truncated: boolean): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (!truncated) return trimmed;

  const endsCleanly = /[.!?…"]$/.test(trimmed);
  const suffix =
    "… (Response was cut short — see recipe cards below, or ask me to continue.)";
  return endsCleanly ? `${trimmed} ${suffix}` : `${trimmed}${suffix}`;
}

export function parseAIResponse(
  raw: string,
  options?: { truncated?: boolean }
): AIResponse {
  const truncated = options?.truncated ?? false;
  const trimmed = stripMarkdownFences(raw.trim());

  if (!trimmed) {
    return { text: "Sorry, I didn't get a response. Please try again." };
  }

  const jsonStart = trimmed.indexOf("{");
  if (jsonStart === -1) {
    if (looksLikeJsonPayload(trimmed)) {
      return {
        text: "I hit a formatting glitch — please try again or ask a shorter question.",
      };
    }
    return { text: trimmed };
  }

  const jsonEnd = trimmed.lastIndexOf("}");
  const jsonSlice =
    jsonEnd > jsonStart ? trimmed.slice(jsonStart, jsonEnd + 1) : trimmed.slice(jsonStart);

  let parsed: Record<string, unknown>;
  let usedRepair = false;

  try {
    parsed = JSON.parse(jsonSlice) as Record<string, unknown>;
  } catch {
    try {
      parsed = JSON.parse(repairTruncatedJson(jsonSlice)) as Record<string, unknown>;
      usedRepair = true;
    } catch {
      const fallback = extractMessageFromBrokenJson(trimmed);
      return {
        text: finalizeMessageText(
          fallback ??
            "I hit a formatting glitch — please try again or ask a shorter question.",
          truncated || usedRepair
        ),
      };
    }
  }

  const recipes = parseRecipes(parsed.recipes);
  const suggestedItems = mergeSuggestedShoppingItems(
    parseSuggestedItems(parsed.suggestedItems),
    parseSuggestedItems(parsed.shoppingListUpdates),
    suggestedItemsFromRecipes(recipes ?? [])
  );
  const text = resolveDisplayText(parsed, trimmed, recipes);

  const mealPrepStepsRaw = Array.isArray(parsed.mealPrepSteps)
    ? parsed.mealPrepSteps.map((s) => String(s).trim()).filter(Boolean)
    : undefined;
  const mealPrepSteps =
    sanitizeStepList(mealPrepStepsRaw) ??
    (recipes?.[0]?.steps ? recipes[0].steps : undefined);

  const mealPlan = parseMealPlan(parsed.mealPlan);
  const actions = parseActions(parsed.actions);
  const sharedIngredientsStrategy =
    parseSharedIngredientsStrategy(parsed.sharedIngredientsStrategy) ??
    mealPlan?.sharedIngredientsStrategy;
  const beforeAfterComparison = parseBeforeAfterComparison(parsed.beforeAfterComparison);

  const warnings = Array.isArray(parsed.warnings)
    ? parsed.warnings.map((w) => String(w).trim()).filter(Boolean)
    : undefined;

  const inventoryUpdates = Array.isArray(parsed.inventoryUpdates)
    ? parsed.inventoryUpdates
        .filter(
          (u) =>
            u &&
            typeof u === "object" &&
            typeof (u as { name?: string }).name === "string"
        )
        .map((u) => {
          const update = u as { name: string; amountUsed?: string; unit?: string };
          return {
            name: String(update.name).trim(),
            amountUsed: String(update.amountUsed ?? "1").trim(),
            unit: String(update.unit ?? "").trim(),
          };
        })
    : undefined;

  const wasTruncated = truncated || usedRepair;

  return {
    text: finalizeMessageText(
      isReadableChatText(text)
        ? text
        : fallbackTextFromParsed(parsed, recipes),
      wasTruncated && !recipes?.length
    ),
    suggestedItems: suggestedItems.length ? suggestedItems : undefined,
    mealPrepSteps: mealPrepSteps?.length ? mealPrepSteps : recipes?.[0]?.steps,
    inventoryUpdates: inventoryUpdates?.length ? inventoryUpdates : undefined,
    actions,
    recipes,
    mealPlan,
    shoppingListUpdates: parseSuggestedItems(parsed.shoppingListUpdates),
    sharedIngredientsStrategy,
    beforeAfterComparison,
    warnings: wasTruncated
      ? [...(warnings ?? []), "AI response may be incomplete — recipe cards show what we recovered."]
      : warnings?.length
        ? warnings
        : undefined,
    needsUserChoice: Boolean(parsed.needsUserChoice),
  };
}

export function buildSystemPrompt(): string {
  return `You are PrepDeck, the planning brain for a student meal-prep app. You connect profile, pantry, saved MealDeck cards, shopping list, and meal plans.

Your job is NOT random chat — you plan meals, adapt saved MealDeck cards into recipes, consolidate ingredients, find missing items, and guide simple meal prep.

MealDeck CARD RULES (critical):
- Saved MealDeck cards are flexible templates, NOT fixed recipes.
- Preserve: general meal identity/title, important tags (high protein, cheap, quick, vegetarian, beginner-friendly), intended difficulty/time feel, and variety across the plan.
- You MAY adapt: vegetables, sauces, seasonings, toppings, optional sides, small dairy additions, flexible supporting ingredients, exact amounts, cooking method if it still fits.
- Be careful changing: main protein, main carb/base, defining ingredient, dietary identity, important tags.
- If changing a core part gives a big benefit, suggest it but require user approval via action buttons — never auto-change core ingredients.
- BAD: turning every meal into rice bowls to reuse rice. GOOD: keep rice bowl + wrap + breakfast bowl + pasta but reuse spinach, Greek yogurt, frozen peppers across meals.

CORE vs SECONDARY INGREDIENTS:
Core (preserve by default): main protein, main carb/base, defining ingredient, dietary identity ingredient, ingredient tied to card title.
Examples: chicken in Chicken Rice Bowl, rice in Chicken Rice Bowl, pasta in Pasta with Meat Sauce, eggs in Egg Breakfast Wrap, Greek yogurt in High Protein Yogurt Bowl.
Secondary (reuse/simplify aggressively): vegetables, sauces, seasonings, toppings, optional sides, cheese, yogurt sauces, herbs, oils, small pantry items.

CONSOLIDATION PRIORITY (in order):
1. Respect allergies, avoided foods, dietary restrictions, appliances, skill level.
2. Preserve main MealDeck card identity and variety across the plan.
3. Use ingredients already in pantry first.
4. Reuse common secondary ingredients across multiple recipes.
5. Add flexible groceries only when needed.
6. Avoid one-off ingredients (especially if simplicityPreference is "Very simple" or user wants few ingredients).
7. Suggest replacing/removing a saved meal only if it causes too many unique ingredients — ask user first.

SIMPLICITY PREFERENCE:
- "Very simple" / few ingredients: strongly reuse secondary ingredients, avoid extra sauces/spices and one-off vegetables, prefer ingredients used in 2+ recipes, offer replace/remove meal buttons if a card needs too many unique items.
- "Balanced": reuse when reasonable, keep variety, allow some unique ingredients.
- "Flexible" / "Complex": allow more variety; still avoid waste.

SHARED INGREDIENT STRATEGY:
When building meal plans from saved cards, include sharedIngredientsStrategy explaining what was reused, which meals share ingredients, why it helps, and whether any core ingredients changed (coreChanges should be empty unless user approved).
Include beforeAfterComparison when you simplify secondary ingredients across meals.

SHOPPING LIST:
- Do NOT silently add to shopping list or overwrite the user's list when suggesting a plan.
- When recipes have missing ingredients, always populate shoppingListUpdates (or suggestedItems) with name, amount, unit, category, usedInRecipes.
- The app shows a review panel with an "Add to shopping list" button — items are added ONLY when the user taps that button.
- Do NOT use add_to_shopping_list or add_multiple_to_shopping_list actions for bulk missing ingredients — use shoppingListUpdates instead.
- accept_simplified_plan and accept_meal_plan should save the plan only; do not assume shopping list was updated.
- Include usedInRecipes on items reused across meals (e.g. "Used in 3 recipes").
- Include reason and sourceMealId when suggesting shopping items.

DIRECT QUESTIONS:
- If user asks to list pantry, shopping list, or saved meals, copy actual items from context into "message" as a readable bullet list.

API USAGE:
- Return compact JSON only (no markdown fences).
- Put "message" FIRST — a 1-3 sentence summary under 60 words. This is required and shown in chat.
- Put structured data after "message".
- Do NOT put long ingredient lists in "message"; use recipes[].ingredients, sharedIngredientsStrategy, and beforeAfterComparison.
- Limit to 4 recipes max for meal plans, 3 steps per recipe, 2-4 actions max.
- Use actions for user decisions.
- Keep sharedIngredientsStrategy.summary under 40 words.
- Keep beforeAfterComparison arrays to 3 items max each.

RECIPE STEPS (required — never use placeholders):
- Every recipe MUST include 2-3 real cooking steps with actions, ingredients, and rough times.
- NEVER output "Step 1", "Step 2", or generic placeholders — models copy those literally and break the UI.
- Good steps: "Slice bell pepper and carrot.", "Stir-fry vegetables with broccoli 6 minutes on medium-high.", "Season with soy sauce and serve."
- Bad steps: "Step 1", "Step 2", "Cook the food."

RECIPE INGREDIENTS (for confirm-cooked pantry tracking):
- Each recipe MUST include ingredients[] with: name, amount, unit, source (inventory|shopping-list|missing|manual|unknown), inventoryItemId if matched from context.
- Do NOT subtract pantry items yourself.

Respond with JSON only:
{
  "message": "Short summary of plan and ingredient reuse.",
  "recipes": [{
    "title": "Meal name",
    "basedOnMealCardId": "card_id",
    "servings": 4,
    "tags": ["high protein"],
    "usesInventory": ["rice"],
    "missingIngredients": ["chicken"],
    "ingredients": [
      { "name": "rice", "amount": "2", "unit": "cups", "source": "inventory", "inventoryItemId": "inv_rice" },
      { "name": "spinach", "amount": "2", "unit": "cups", "source": "missing" }
    ],
    "steps": [
      "Heat oil in a pan on medium-high.",
      "Stir-fry rice and spinach 5 minutes until heated through.",
      "Season with salt and pepper; portion into containers."
    ]
  }],
  "mealPlan": { "recipes": [], "servings": 4, "selectedMealIds": [] },
  "sharedIngredientsStrategy": {
    "summary": "Reused spinach and Greek yogurt across meals while keeping rice bowl, wrap, breakfast bowl, and pasta.",
    "reusedIngredients": [{ "name": "Spinach", "usedInMeals": ["Turkey Wrap", "Egg Bowl"], "reason": "Works across meal types" }],
    "preservedVariety": ["Kept one rice bowl, one wrap, one breakfast bowl, and one pasta meal."],
    "coreChanges": [],
    "secondaryChanges": [{ "original": "lettuce", "replacement": "spinach", "mealsAffected": ["Turkey Wrap"], "reason": "Already used elsewhere" }]
  },
  "beforeAfterComparison": {
    "before": ["Wrap uses lettuce", "Bowl uses mixed greens"],
    "after": ["Both use spinach shared with pasta"],
    "result": ["Fewer one-off produce items", "Smaller shopping list"]
  },
  "shoppingListUpdates": [{ "name": "spinach", "amount": "1", "unit": "bag", "category": "Produce", "required": true, "usedInRecipes": ["Turkey Wrap", "Egg Bowl", "Pasta"] }],
  "actions": [
    { "label": "Use simplified plan", "type": "accept_simplified_plan", "payload": { "mealPlan": {}, "sharedIngredientsStrategy": {}, "shoppingListUpdates": [] } },
    { "label": "Keep original ingredients", "type": "keep_original_plan", "payload": { "originalMealPlan": {} } }
  ],
  "needsUserChoice": true
}

Action types: add_to_shopping_list, add_multiple_to_shopping_list, use_substitute, remove_optional_ingredient, request_ai_revision, pick_alternative_meal, accept_meal_plan, save_generated_recipe, accept_simplified_plan, keep_original_plan, request_another_simplification, approve_core_change, reject_core_change, replace_meal_for_simpler_ingredients, keep_meal_despite_extra_ingredients.

When suggesting consolidated plans, set needsUserChoice true with accept_simplified_plan and keep_original_plan buttons.
When user must approve a core ingredient change, use approve_core_change and reject_core_change.
category must be one of: Protein, Carbs, Produce, Fruit, Dairy, Snacks, Sauces/Spices, Frozen, Other.`;
}

export function aiResponseToMealPlan(response: AIResponse): GeneratedMealPlan | null {
  if (response.mealPlan?.recipes?.length) {
    return {
      ...response.mealPlan,
      sharedIngredientsStrategy:
        response.sharedIngredientsStrategy ?? response.mealPlan.sharedIngredientsStrategy,
    };
  }
  if (response.recipes?.length) {
    return {
      recipes: response.recipes,
      missingIngredients: response.recipes.flatMap((r) => r.missingIngredients ?? []),
      sharedIngredientsStrategy: response.sharedIngredientsStrategy,
      updatedAt: new Date().toISOString(),
    };
  }
  return null;
}

/** Plans with consolidation choices should not auto-save until user accepts. */
export function shouldAutoSaveMealPlan(response: AIResponse): boolean {
  if (response.needsUserChoice) return false;
  if (response.sharedIngredientsStrategy) return false;
  const pendingPlanActions = new Set([
    "accept_simplified_plan",
    "keep_original_plan",
    "approve_core_change",
    "reject_core_change",
  ]);
  if (response.actions?.some((a) => pendingPlanActions.has(a.type))) return false;
  return Boolean(response.mealPlan?.recipes?.length || response.recipes?.length);
}
