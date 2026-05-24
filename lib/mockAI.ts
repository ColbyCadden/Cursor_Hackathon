import { getDefaultForIngredient } from "./ingredientDefaults";
import { findInventoryMatch, ingredientsMatch } from "./inventoryMatching";
import { getSavedMeals } from "./meal/mealHelpers";
import { buildMealdexShoppingList } from "./meal/shoppingList";
import { mealToSummary } from "./ai/mealSummaries";
import { tryLocalChatReply } from "./localChatReplies";
import type { AIResponse } from "./ai/chatHelpers";
import type {
  AdaptedRecipe,
  AdaptedRecipeIngredient,
  AppState,
  BeforeAfterComparison,
  GeneratedMealPlan,
  InventoryItem,
  InventoryCategory,
  SharedIngredientsStrategy,
  SuggestedShoppingItem,
} from "./types";

export type { AIResponse } from "./ai/chatHelpers";

type Intent =
  | "meal_prep"
  | "mealdex_plan"
  | "inventory"
  | "fewer_ingredients"
  | "simpler"
  | "shopping_list"
  | "prep_guide"
  | "general";

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function detectIntent(message: string): Intent {
  const m = normalize(message);
  if (
    /meal deck|mealdex|saved cards|saved meal|meal library/.test(m) &&
    /make|plan|recipe|build|from|using/.test(m)
  ) {
    return "mealdex_plan";
  }
  if (/meal prep guide|prep guide|how (do i|to) prep|prep order/.test(m)) {
    return "prep_guide";
  }
  if (/shopping list|update my shopping|buy|grocery list|missing/.test(m)) {
    return "shopping_list";
  }
  if (/fewer ingredients|less ingredients|reduce ingredients/.test(m)) {
    return "fewer_ingredients";
  }
  if (/make (it |this )?simpler|easier|beginner|less steps/.test(m)) {
    return "simpler";
  }
  if (
    /meal prep|\d+\s*meals?|meals for the week|prep \d+|week of meals/.test(m)
  ) {
    return "meal_prep";
  }
  if (
    /what can i cook|with my (inventory|pantry)|what (do i|can i) make|use what i have/.test(
      m
    )
  ) {
    return "inventory";
  }
  return "general";
}

function extractMealCount(message: string): number {
  const match = message.match(/(\d+)\s*meals?/);
  if (match) return Math.min(14, Math.max(2, parseInt(match[1], 10)));
  if (/week/.test(normalize(message))) return 8;
  return 6;
}

function profileIntro(profile: AppState["profile"]): string {
  const parts = [
    `Since you're a ${profile.cookingSkill.toLowerCase()} and want meals around ${profile.availableTime}, I'd keep this simple.`,
  ];
  if (profile.simplicityPreference) {
    parts.push(`Your preference: ${profile.simplicityPreference.toLowerCase()}.`);
  }
  if (profile.avoidedFoods.some((f) => f.toLowerCase() !== "none")) {
    parts.push(
      `I'll avoid: ${profile.avoidedFoods.filter((f) => f.toLowerCase() !== "none").join(", ")}.`
    );
  }
  return parts.join(" ");
}

function inventoryList(inventory: AppState["inventory"]): string {
  if (!inventory.length) return "your pantry (currently empty)";
  return inventory
    .map((i) => `${i.name} (${i.amount}${i.unit ? ` ${i.unit}` : ""}, ${i.portionsLeft} portions left)`)
    .join(", ");
}

function savedMealNames(state: AppState): string[] {
  return getSavedMeals(state).map((m) => m.name);
}

function hasIngredient(inventory: AppState["inventory"], keyword: string): boolean {
  const k = keyword.toLowerCase();
  return inventory.some((i) => i.name.toLowerCase().includes(k));
}

function buildMealIdeas(state: AppState): {
  plan: { name: string; count: number; note: string }[];
  reuse: string[];
} {
  const { inventory } = state;
  const saved = savedMealNames(state);
  const plan: { name: string; count: number; note: string }[] = [];
  const reuse = new Set<string>();

  const addPlan = (name: string, count: number, note: string, ingredients: string[]) => {
    plan.push({ name, count, note });
    ingredients.forEach((i) => reuse.add(i));
  };

  if (hasIngredient(inventory, "chicken") || saved.some((s) => s.toLowerCase().includes("chicken"))) {
    addPlan("Chicken rice bowls", 4, "uses rice + frozen veg", ["rice", "chicken", "frozen vegetables"]);
  }
  if (hasIngredient(inventory, "egg") || saved.some((s) => s.toLowerCase().includes("egg"))) {
    addPlan("Egg breakfast wraps", 2, "quick mornings", ["eggs", "tortillas"]);
  }
  if (hasIngredient(inventory, "rice")) {
    addPlan("Tuna rice bowls", 2, "no-cook protein option", ["rice", "canned tuna"]);
  }
  if (hasIngredient(inventory, "frozen")) {
    reuse.add("frozen vegetables");
  }

  if (plan.length === 0) {
    addPlan("Simple rice & egg bowls", 3, "minimal ingredients", ["rice", "eggs"]);
    addPlan("Microwave veggie bowls", 3, "low effort", ["frozen vegetables", "rice"]);
  }

  return { plan, reuse: [...reuse] };
}

function defaultSuggestedItems(state: AppState, mealCount: number): SuggestedShoppingItem[] {
  const items: SuggestedShoppingItem[] = [];
  const { inventory } = state;

  if (!hasIngredient(inventory, "tortilla")) {
    items.push({
      name: "Tortillas",
      amount: "1",
      unit: "pack",
      category: "Carbs",
      required: true,
    });
  }
  if (hasIngredient(inventory, "chicken") && mealCount >= 6) {
    items.push({
      name: "Chicken breast",
      amount: "500",
      unit: "g",
      category: "Protein",
      required: true,
    });
  }
  if (!hasIngredient(inventory, "tuna")) {
    items.push({
      name: "Canned tuna",
      amount: "2",
      unit: "cans",
      category: "Protein",
      required: true,
    });
  }
  if (!hasIngredient(inventory, "sauce") && !hasIngredient(inventory, "soy")) {
    items.push({
      name: "Soy sauce",
      amount: "1",
      unit: "bottle",
      category: "Other",
      required: false,
    });
  }

  return items;
}

function defaultPrepSteps(profile: AppState["profile"]): string[] {
  const appliance =
    profile.appliances.find((a) => a.toLowerCase().includes("stove")) ?? "stove";
  return [
    `Cook rice first on the ${appliance.toLowerCase()} — it takes the longest and frees you up for everything else.`,
    "While rice cooks, season and cook chicken in one pan (same pan = fewer dishes).",
    "Steam or microwave frozen vegetables while chicken finishes.",
    "Portion rice, chicken, and vegetables into containers for bowls.",
    "Prep wraps last with eggs so they stay fresh — store separately if eating later in the week.",
  ];
}

function parseInventoryAmount(amount: string): number {
  const n = parseFloat(String(amount).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function buildDemoRecipeIngredients(
  inventory: InventoryItem[],
  usesInventory: string[],
  missingIngredients: string[]
): AdaptedRecipeIngredient[] {
  const rows: AdaptedRecipeIngredient[] = [];

  for (const name of usesInventory.slice(0, 4)) {
    const match =
      findInventoryMatch(inventory, name) ??
      inventory.find((i) => ingredientsMatch(i.name, name));
    if (match) {
      const available = parseInventoryAmount(match.amount);
      rows.push({
        name: match.name,
        amount: String(Math.max(1, Math.round(available / 2))),
        unit: match.unit,
        source: "inventory",
        inventoryItemId: match.id,
      });
    } else {
      const defaults = getDefaultForIngredient(name);
      rows.push({
        name,
        amount: defaults.amount,
        unit: defaults.unit,
        source: "inventory",
      });
    }
  }

  for (const name of missingIngredients.slice(0, 2)) {
    const defaults = getDefaultForIngredient(name);
    rows.push({
      name,
      amount: defaults.amount,
      unit: defaults.unit,
      source: "missing",
    });
  }

  return rows;
}

function buildSharedStrategyForSavedMeals(
  mealNames: string[]
): SharedIngredientsStrategy {
  const names = mealNames.slice(0, 4);
  return {
    summary:
      "I reused Greek yogurt, frozen broccoli, and rice from your pantry across multiple meals to keep the shopping list smaller while preserving meal variety.",
    reusedIngredients: [
      {
        name: "Greek yogurt",
        usedInMeals: names.filter((n) =>
          /yogurt|burrito|wrap|bowl/i.test(n)
        ).slice(0, 2),
        reason: "Works as a high-protein sauce/base in different meal types.",
      },
      {
        name: "Frozen broccoli",
        usedInMeals: names.filter((n) => /salmon|rice|tuna|poke|bowl/i.test(n)).slice(0, 2),
        reason: "Easy student-friendly veg that works in bowls.",
      },
      {
        name: "Rice",
        usedInMeals: names.filter((n) => /salmon|rice|tuna|poke|burrito/i.test(n)).slice(0, 2),
        reason: "Shared carb base from your pantry.",
      },
    ].filter((item) => item.usedInMeals.length > 0),
    preservedVariety: [
      names.length >= 4
        ? `Kept ${names.slice(0, 4).join(", ")} — different meal types, not all the same format.`
        : `Kept your saved meal ideas: ${names.join(", ")}.`,
    ],
    coreChanges: [],
    secondaryChanges: [
      {
        original: "mixed greens",
        replacement: "frozen broccoli",
        mealsAffected: names.filter((n) => /tuna|poke/i.test(n)).slice(0, 1),
        reason: "Broccoli is already in your pantry and used in other bowls.",
      },
      {
        original: "sour cream",
        replacement: "Greek yogurt",
        mealsAffected: names.filter((n) => /burrito/i.test(n)).slice(0, 1),
        reason: "Greek yogurt is already in your pantry and adds protein.",
      },
    ],
  };
}

function buildBeforeAfterForSavedMeals(mealNames: string[]): BeforeAfterComparison {
  const [a, b, c, d] = mealNames;
  return {
    before: [
      a ? `${a} uses separate vegetables` : "Each meal uses different vegetables",
      b ? `${b} uses sour cream or ranch` : "Wrap uses its own sauce",
      c ? `${c} uses granola or berries separately` : "Breakfast bowl uses unique toppings",
      d ? `${d} uses its own produce mix` : "Pasta/bowl uses separate produce",
    ].filter(Boolean),
    after: [
      "Greek yogurt shared as sauce/base in wrap and breakfast bowl",
      "Frozen broccoli shared in rice/salmon and poke bowls",
      "Rice from pantry shared where it fits",
    ],
    result: [
      "Fewer one-off ingredients",
      "Smaller shopping list",
      "Meal variety preserved across your saved cards",
    ],
  };
}

function buildRecipesFromSavedMeals(state: AppState): AdaptedRecipe[] {
  const savedMeals = getSavedMeals(state).slice(0, 4);
  return savedMeals.map((meal) => {
    const usesInventory = state.inventory
      .filter((i) =>
        meal.ingredients.some((ing) =>
          ingredientsMatch(ing, i.name)
        )
      )
      .map((i) => i.name);
    const invNames = state.inventory.slice(0, 3).map((i) => i.name);
    const combinedUses = [...new Set([...usesInventory, ...invNames])].slice(0, 4);
    const missingIngredients = ["salmon", "tuna", "black beans"]
      .filter((k) => meal.name.toLowerCase().includes(k.split(" ")[0]))
      .filter((k) => !hasIngredient(state.inventory, k))
      .slice(0, 1);
    if (!missingIngredients.length && meal.name.toLowerCase().includes("salmon")) {
      missingIngredients.push("salmon fillet");
    }

    return {
      title: meal.name,
      basedOnMealCardId: meal.id,
      tags: meal.highProtein ? ["high protein"] : [],
      usesInventory: combinedUses,
      missingIngredients,
      ingredients: buildDemoRecipeIngredients(
        state.inventory,
        combinedUses,
        missingIngredients
      ),
      steps: defaultPrepSteps(state.profile).slice(0, 3),
    };
  });
}

function buildConsolidatedShoppingUpdates(
  recipes: { title: string }[]
): SuggestedShoppingItem[] {
  const recipeTitles = recipes.map((r) => r.title);
  return [
    {
      name: "Spinach",
      amount: "1",
      unit: "bag",
      category: "Produce" as InventoryCategory,
      required: true,
      reason: "Shared vegetable across multiple meals",
      usedInRecipes: recipeTitles.filter((t) => /wrap|burrito|bowl|pasta/i.test(t)).slice(0, 3),
      source: "ai" as const,
    },
    {
      name: "Salmon fillet",
      amount: "2",
      unit: "fillets",
      category: "Protein" as InventoryCategory,
      required: true,
      reason: "Core protein for salmon bowl",
      usedInRecipes: recipeTitles.filter((t) => /salmon/i.test(t)),
      source: "ai" as const,
    },
  ].filter((item) => item.usedInRecipes?.length) as SuggestedShoppingItem[];
}

function respondMealdexPlan(message: string, state: AppState): AIResponse {
  const savedMeals = getSavedMeals(state);
  const count = extractMealCount(message);
  const mealNames = savedMeals.map((m) => m.name);

  if (!savedMeals.length) {
    return {
      text: `${profileIntro(state.profile)}

You haven't saved any Mealdeck cards yet. Swipe right on Discover, then ask me to build a plan from your saved cards.`,
      needsUserChoice: false,
    };
  }

  const recipes = buildRecipesFromSavedMeals(state);
  const sharedIngredientsStrategy = buildSharedStrategyForSavedMeals(mealNames);
  const beforeAfterComparison = buildBeforeAfterForSavedMeals(mealNames);
  const shoppingListUpdates = buildConsolidatedShoppingUpdates(recipes);
  const mealPlan: GeneratedMealPlan = {
    selectedMealIds: savedMeals.slice(0, 4).map((m) => m.id),
    recipes,
    servings: count,
    missingIngredients: recipes.flatMap((r) => r.missingIngredients ?? []),
    sharedIngredientsStrategy,
  };

  const text = `${profileIntro(state.profile)}

I built a ${Math.min(recipes.length, count)}-meal plan from your Mealdeck that keeps meal variety but reuses secondary ingredients. I kept ${mealNames.slice(0, 4).join(", ")} as distinct meals — not all the same format — while sharing Greek yogurt, frozen broccoli, and rice where they fit.`;

  return {
    text,
    recipes,
    mealPlan,
    sharedIngredientsStrategy,
    beforeAfterComparison,
    shoppingListUpdates,
    mealPrepSteps: defaultPrepSteps(state.profile).slice(0, 4),
    actions: [
      {
        label: "Use simplified plan",
        type: "accept_simplified_plan",
        payload: {
          mealPlan,
          sharedIngredientsStrategy,
          shoppingListUpdates,
        },
      },
      {
        label: "Keep original ingredients",
        type: "keep_original_plan",
        payload: {
          originalMealPlan: {
            ...mealPlan,
            sharedIngredientsStrategy: undefined,
            userDecisions: ["Kept original per-meal ingredients"],
          },
        },
      },
      {
        label: "Show another option",
        type: "request_another_simplification",
        payload: {
          instruction:
            "Suggest a different ingredient consolidation for my Mealdeck plan that still preserves meal variety.",
        },
      },
    ],
    needsUserChoice: true,
  };
}

function respondMealPrep(message: string, state: AppState): AIResponse {
  const savedMeals = getSavedMeals(state);
  const simplicity = state.profile.simplicityPreference?.toLowerCase() ?? "";
  if (
    savedMeals.length >= 2 &&
    (/very simple|minimal|few ingredients|fewer ingredients/.test(simplicity) ||
      /from my|saved|meal deck|mealdex|cards/.test(normalize(message)))
  ) {
    return respondMealdexPlan(message, state);
  }

  const count = extractMealCount(message);
  const { plan, reuse } = buildMealIdeas(state);
  const intro = profileIntro(state.profile);
  const saved = savedMealNames(state);

  let total = 0;
  const scaled = plan.map((p) => {
    const share = Math.max(1, Math.round((count / plan.length) * (p.count / 4)));
    total += share;
    return { ...p, count: share };
  });

  while (total < count && scaled.length) {
    scaled[0].count += 1;
    total += 1;
  }

  const planText = scaled
    .map((p, i) => `${i + 1}. ${p.name} x${p.count} — ${p.note}`)
    .join("\n");

  const savedNote =
    saved.length > 0
      ? `\n\nI'm leaning on saved ideas you liked (${saved.slice(0, 3).join(", ")}) as preferences — not strict recipes.`
      : "";

  const text = `${intro}

Based on your pantry (${inventoryList(state.inventory)}) and saved meal ideas, I'd suggest:

${planText}

This keeps things simple by reusing ${reuse.join(", ")} instead of making you buy lots of different ingredients.${savedNote}

You'll get about ${count} portions without extra spices or specialty items.`;

  return {
    text,
    mealPrepSteps: defaultPrepSteps(state.profile),
    suggestedItems: defaultSuggestedItems(state, count),
    recipes: savedMeals.slice(0, 2).map((meal) => {
      const usesInventory = state.inventory.slice(0, 3).map((i) => i.name);
      const missingIngredients = ["chicken breast"];
      return {
        title: meal.name,
        basedOnMealCardId: meal.id,
        tags: meal.highProtein ? ["high protein"] : [],
        usesInventory,
        missingIngredients,
        ingredients: buildDemoRecipeIngredients(
          state.inventory,
          usesInventory,
          missingIngredients
        ),
        steps: defaultPrepSteps(state.profile).slice(0, 3),
      };
    }),
    actions: [
      {
        label: "Add missing ingredients to shopping list",
        type: "add_multiple_to_shopping_list",
        payload: {
          items: defaultSuggestedItems(state, count).map((item) => ({
            ...item,
            reason: "Needed for your meal prep plan",
          })),
        },
      },
      {
        label: "Make this cheaper",
        type: "request_ai_revision",
        payload: { instruction: "Make the meal plan cheaper using current pantry." },
      },
      {
        label: "Accept this meal plan",
        type: "accept_meal_plan",
        payload: {
          mealPlan: {
            recipes: savedMeals.slice(0, 2).map((meal) => ({
              title: meal.name,
              basedOnMealCardId: meal.id,
              servings: count,
            })),
            servings: count,
          },
        },
      },
    ],
    needsUserChoice: false,
  };
}

function respondInventory(state: AppState): AIResponse {
  const intro = profileIntro(state.profile);
  const { inventory } = state;
  const mealLibrary = getSavedMeals(state);
  const hasChicken = hasIngredient(inventory, "chicken");
  const hasTurkey = hasIngredient(inventory, "turkey");
  const savedBowl = mealLibrary.find(
    (m) => m.name.toLowerCase().includes("bowl") || m.name.toLowerCase().includes("rice")
  );

  if (savedBowl && !hasChicken && hasTurkey) {
    return {
      text: `${intro}

You saved **${savedBowl.name}**, but you don't have chicken in your pantry. You do have **turkey slices**.

What would you like to do?`,
      actions: [
        {
          label: "Use turkey instead",
          type: "use_substitute",
          payload: {
            mealTitle: savedBowl.name,
            originalIngredient: "chicken",
            substituteIngredient: "turkey slices",
          },
        },
        {
          label: "Add chicken to shopping list",
          type: "add_to_shopping_list",
          payload: {
            name: "Chicken breast",
            amount: "500",
            unit: "g",
            category: "Protein",
            required: true,
            reason: `Needed for ${savedBowl.name}`,
            sourceMealId: savedBowl.id,
          },
        },
        {
          label: "Pick another high-protein saved meal",
          type: "pick_alternative_meal",
          payload: { tag: "high protein" },
        },
      ],
      needsUserChoice: true,
    };
  }

  const ideas: string[] = [];

  if (hasIngredient(inventory, "chicken") && hasIngredient(inventory, "rice")) {
    ideas.push(
      "**Chicken rice bowl** — cook rice, pan-sear chicken, add frozen veg. ~25 min on the stove."
    );
  }
  if (hasIngredient(inventory, "egg")) {
    ideas.push(
      "**Egg fried rice** — scramble eggs, stir in leftover rice and vegetables. ~15 min."
    );
  }
  if (hasIngredient(inventory, "egg") && hasIngredient(inventory, "rice")) {
    ideas.push(
      "**Egg & rice bowl** — soft-scramble eggs over warm rice with soy sauce if you have it."
    );
  }
  if (hasIngredient(inventory, "frozen")) {
    ideas.push(
      "**Microwave veggie side** — steam frozen vegetables as a side for any bowl. ~5 min."
    );
  }

  if (mealLibrary.length) {
    ideas.push(
      `**From your library:** ${mealLibrary.slice(0, 2).map((m) => m.name).join(" or ")} — adjust to what's left in your pantry.`
    );
  }

  if (ideas.length === 0) {
    ideas.push(
      "Your pantry is light — I'd start with rice + eggs + any frozen veg for a simple bowl."
    );
  }

  const text = `${intro}

Here's what you can realistically make right now:

${ideas.slice(0, 4).map((idea, i) => `${i + 1}. ${idea}`).join("\n\n")}

All of these fit your ${state.profile.availableTime} window and don't need extra gear beyond ${state.profile.appliances.slice(0, 3).join(", ").toLowerCase()}.`;

  return { text };
}

function respondFewerIngredients(state: AppState): AIResponse {
  const intro = profileIntro(state.profile);
  const text = `${intro}

To cut ingredients down, I'd focus on one base + one protein:

1. **Rice bowls** — rice, chicken OR eggs, frozen vegetables. Same three items, different nights.
2. **Skip extra sauces** — salt, pepper, and a little oil are enough for student meal prep.
3. **One pan** — cook protein and veg together to avoid buying separate seasonings.

You're already holding ${state.inventory.map((i) => i.name).join(", ")} — that's enough for a full week if you repeat smartly.`;

  return {
    text,
    mealPrepSteps: [
      "Pick 2 base ingredients from your pantry (e.g. rice + eggs).",
      "Cook a big batch of the base once.",
      "Rotate one protein across containers — no new items needed.",
    ],
  };
}

function respondSimpler(state: AppState): AIResponse {
  const intro = profileIntro(state.profile);
  const methods = state.profile.appliances.includes("Microwave")
    ? "microwave rice and vegetables"
    : "one-pan cooking on the stove";

  const text = `${intro}

Here's a simpler approach:

• **3 steps max per meal:** cook base → cook protein → combine.
• Use **${methods}** — no oven juggling needed.
• Portion into containers immediately so you're done in one session.
• Skip recipes with more than 5 ingredients — your profile says you prefer simplicity.

For a beginner, I'd do chicken rice bowls one night and egg wraps another — same tools, minimal cleanup.`;

  return {
    text,
    mealPrepSteps: defaultPrepSteps(state.profile).slice(0, 3),
  };
}

function respondShoppingList(state: AppState): AIResponse {
  const saved = getSavedMeals(state);
  const shopItems = buildMealdexShoppingList(saved);

  if (!saved.length) {
    return {
      text: `Your **Shop** list comes from meals saved in **Mealdeck**.

Head to **Discover**, swipe right on meals you like, then check **Shop** — ingredients merge automatically. No manual list needed.`,
    };
  }

  const preview = shopItems
    .slice(0, 10)
    .map((i) => `• ${i.name}${i.count > 1 ? ` ×${i.count}` : ""}`)
    .join("\n");

  const text = `Your **Mealdeck** has ${saved.length} saved meal(s), which gives you **${shopItems.length}** shopping item(s):

${preview}${shopItems.length > 10 ? "\n…and more on the Shop tab." : ""}

Save more meals on **Discover** to grow this list.`;

  return { text };
}

function respondPrepGuide(state: AppState): AIResponse {
  const intro = profileIntro(state.profile);
  const steps = defaultPrepSteps(state.profile);

  const text = `${intro}

**Simple prep order for your setup:**

${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Total active time: about ${state.profile.availableTime}. Do containers first so cleanup is easy.`;

  return { text, mealPrepSteps: steps };
}

function respondGeneral(message: string, state: AppState): AIResponse {
  const intro = profileIntro(state.profile);
  const text = `${intro}

I can help you plan meals using what's in your kitchen (${inventoryList(state.inventory)}) and your saved ideas${savedMealNames(state).length ? `: ${savedMealNames(state).join(", ")}` : ""}.

Try asking:
• "I need to meal prep 8 meals."
• "What can I cook with my pantry?"
• "Update my shopping list."

You asked: "${message.trim()}" — I'll keep suggestions student-friendly with fewer ingredients and less cleanup.`;

  return { text };
}

/**
 * Mock AI fallback when `/api/chat` is unavailable or GEMINI_API_KEY is not set.
 */
async function generateMockAIResponse(
  userMessage: string,
  appState: AppState
): Promise<AIResponse> {
  await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 400));

  const intent = detectIntent(userMessage);

  switch (intent) {
    case "mealdex_plan":
      return respondMealdexPlan(userMessage, appState);
    case "meal_prep":
      return respondMealPrep(userMessage, appState);
    case "inventory":
      return respondInventory(appState);
    case "fewer_ingredients":
      return respondFewerIngredients(appState);
    case "simpler":
      return respondSimpler(appState);
    case "shopping_list":
      return respondShoppingList(appState);
    case "prep_guide":
      return respondPrepGuide(appState);
    default:
      return respondGeneral(userMessage, appState);
  }
}

/** Calls Gemini/Groq via `/api/chat`, falls back to mock responses when needed. */
export async function generateAIResponse(
  userMessage: string,
  appState: AppState
): Promise<AIResponse> {
  const local = tryLocalChatReply(userMessage, appState);
  if (local) return local;

  try {
    const savedMeals = getSavedMeals(appState).map(mealToSummary);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        profile: appState.profile,
        inventory: appState.inventory,
        shoppingList: appState.shoppingList,
        savedMeals,
        generatedMealPlan: appState.generatedMealPlan ?? null,
        recentMessages: appState.chatMessages.slice(-8).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as AIResponse;
      const text = data.text?.trim();
      if (text && text.length > 5) {
        return data;
      }
    }

    if (res.status === 503) {
      const mock = await generateMockAIResponse(userMessage, appState);
      return { ...mock, source: "unconfigured" };
    }

    if (res.status === 429) {
      const mock = await generateMockAIResponse(userMessage, appState);
      return { ...mock, source: "quota" };
    }
  } catch (error) {
    console.debug("[AI] API unavailable, using mock fallback:", error);
  }

  const mock = await generateMockAIResponse(userMessage, appState);
  return { ...mock, source: "mock" };
}
