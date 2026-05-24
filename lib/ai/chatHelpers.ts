import type { SavedMealSummary } from "@/lib/ai/mealSummaries";
import type {
  AdaptedRecipe,
  ChatAction,
  GeneratedMealPlan,
  InventoryCategory,
  InventoryItem,
  InventoryUpdate,
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
    "Kitchen inventory:",
    inventoryLine,
    "",
    "Shopping list:",
    shoppingLine,
    "",
    "Saved Mealdex meal cards (flexible templates — adapt but preserve core identity & tags):",
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
]);

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

function parseRecipes(raw: unknown): AdaptedRecipe[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const recipes = raw
    .filter((r) => r && typeof r === "object" && (r as AdaptedRecipe).title?.trim())
    .map((r) => {
      const recipe = r as AdaptedRecipe;
      return {
        title: recipe.title.trim(),
        basedOnMealCardId: recipe.basedOnMealCardId,
        servings: recipe.servings,
        tags: recipe.tags,
        usesInventory: recipe.usesInventory,
        missingIngredients: recipe.missingIngredients,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
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
  };
}

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/** Pull message/text from broken or truncated JSON when JSON.parse fails. */
function extractMessageFromBrokenJson(raw: string): string | null {
  const unescaped = (value: string) =>
    value.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();

  const fullMessage = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (fullMessage?.[1]) return unescaped(fullMessage[1]);

  const fullText = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (fullText?.[1]) return unescaped(fullText[1]);

  // Truncated mid-string (no closing quote)
  const truncated = raw.match(/"message"\s*:\s*"([\s\S]*)$/);
  if (truncated?.[1]) {
    const cleaned = truncated[1].replace(/\\n/g, "\n").replace(/["{}[\]]+$/, "").trim();
    if (cleaned.length > 10) return cleaned;
  }

  return null;
}

function looksLikeRawJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith("{") && (t.includes('"message"') || t.includes('"text"'));
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

  const text =
    (typeof parsed.message === "string" ? parsed.message.trim() : "") ||
    (typeof parsed.text === "string" ? parsed.text.trim() : "") ||
    extractMessageFromBrokenJson(trimmed) ||
    trimmed;

  const suggestedItems =
    parseSuggestedItems(parsed.suggestedItems) ??
    parseSuggestedItems(parsed.shoppingListUpdates);

  const mealPrepSteps = Array.isArray(parsed.mealPrepSteps)
    ? parsed.mealPrepSteps.map((s) => String(s).trim()).filter(Boolean)
    : undefined;

  const recipes = parseRecipes(parsed.recipes);
  const mealPlan = parseMealPlan(parsed.mealPlan);
  const actions = parseActions(parsed.actions);

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
      looksLikeRawJson(text)
        ? extractMessageFromBrokenJson(text) ?? "Here's my suggestion — see the recipe cards below."
        : text,
      wasTruncated && !recipes?.length
    ),
    suggestedItems,
    mealPrepSteps: mealPrepSteps?.length ? mealPrepSteps : recipes?.[0]?.steps,
    inventoryUpdates: inventoryUpdates?.length ? inventoryUpdates : undefined,
    actions,
    recipes,
    mealPlan,
    shoppingListUpdates: parseSuggestedItems(parsed.shoppingListUpdates),
    warnings: wasTruncated
      ? [...(warnings ?? []), "AI response may be incomplete — recipe cards show what we recovered."]
      : warnings?.length
        ? warnings
        : undefined,
    needsUserChoice: Boolean(parsed.needsUserChoice),
  };
}

export function buildSystemPrompt(): string {
  return `You are PrepDeck, the planning brain for a student meal-prep app. You connect profile, inventory, saved meal cards, shopping list, and meal plans.

Your job is NOT random chat — you plan meals, adapt saved meal cards into recipes, find missing ingredients, and guide simple meal prep.

MEAL CARD RULES (critical):
- Saved Mealdex cards are flexible templates, NOT fixed recipes.
- Preserve the general title/concept and important tags (high protein, cheap, beginner friendly, vegetarian, etc.).
- You MAY adapt vegetables, sauce, seasoning, amounts, and substitutions.
- Do NOT silently change core identity (e.g. chicken bowl → pasta, high protein → low protein, cheap → expensive).
- If a core ingredient is missing, explain the gap and offer action buttons — do not auto-substitute without user choice.

PROFILE RULES:
- Never suggest avoided foods/allergies.
- Respect skill level, time limit, simplicity preference, and available appliances.

DIRECT QUESTIONS:
- If user asks to list inventory, shopping list, or saved meals, copy the actual items from context into "message" as a readable bullet list. Never leave the list empty when context has items.

SHOPPING LIST RULES:
- Only list missing ingredients (not what they already have).
- Do NOT silently add to shopping list unless user asked to update it.
- For meal plans, show missing items and provide an "Add missing ingredients" action button.
- Include reason and sourceMealId when suggesting shopping items.

API USAGE:
- Return compact JSON only (no markdown fences).
- Put structured data FIRST, "message" LAST.
- "message" must be 1-2 short sentences (under 40 words) — summary only.
- Do NOT put ingredient lists, steps, or long explanations in "message"; use recipes[].steps and actions instead.
- Limit to 2 recipes max, 3 steps per recipe, 2-3 actions max.
- Use actions for user decisions.

Respond with JSON only:
{
  "recipes": [{ "title": "Meal name", "basedOnMealCardId": "id", "servings": 4, "tags": ["high protein"], "usesInventory": ["rice"], "missingIngredients": ["chicken"], "steps": ["Step 1", "Step 2"] }],
  "actions": [{ "label": "Add missing ingredients", "type": "add_multiple_to_shopping_list", "payload": { "items": [{ "name": "chicken breast", "amount": "500", "unit": "g", "category": "Protein", "required": true }] } }],
  "needsUserChoice": false,
  "message": "One or two short sentences summarizing the plan."
}

Action types: add_to_shopping_list, add_multiple_to_shopping_list, use_substitute, remove_optional_ingredient, request_ai_revision, pick_alternative_meal, accept_meal_plan, save_generated_recipe.

When user must choose (missing core ingredient, substitution), set needsUserChoice true and include 2-3 action buttons.
category must be one of: Protein, Carbs, Produce, Fruit, Dairy, Snacks, Sauces/Spices, Frozen, Other.`;
}

export function aiResponseToMealPlan(response: AIResponse): GeneratedMealPlan | null {
  if (response.mealPlan?.recipes?.length) return response.mealPlan;
  if (response.recipes?.length) {
    return {
      recipes: response.recipes,
      missingIngredients: response.recipes.flatMap((r) => r.missingIngredients ?? []),
      updatedAt: new Date().toISOString(),
    };
  }
  return null;
}
