import { getSavedMeals } from "./meal/mealHelpers";
import { buildMealdexShoppingList } from "./meal/shoppingList";
import type { AIResponse } from "./ai/chatHelpers";
import type { AppState, SuggestedShoppingItem } from "./types";

export type { AIResponse } from "./ai/chatHelpers";

type Intent =
  | "meal_prep"
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
    /what can i cook|with my inventory|what (do i|can i) make|use what i have/.test(
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
    .map((i) => `${i.name} (${i.amount}${i.unit ? ` ${i.unit}` : ""}, ${i.percentLeft}% left)`)
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

function respondMealPrep(message: string, state: AppState): AIResponse {
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

Based on your inventory (${inventoryList(state.inventory)}) and saved meal ideas, I'd suggest:

${planText}

This keeps things simple by reusing ${reuse.join(", ")} instead of making you buy lots of different ingredients.${savedNote}

You'll get about ${count} portions without extra spices or specialty items.`;

  return {
    text,
    mealPrepSteps: defaultPrepSteps(state.profile),
    suggestedItems: defaultSuggestedItems(state, count),
  };
}

function respondInventory(state: AppState): AIResponse {
  const intro = profileIntro(state.profile);
  const { inventory } = state;
  const mealLibrary = getSavedMeals(state);
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
      "Your inventory is light — I'd start with rice + eggs + any frozen veg for a simple bowl."
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
      "Pick 2 base ingredients from your inventory (e.g. rice + eggs).",
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
      text: `Your **Shop** list comes from meals saved in **Mealdex**.

Head to **Discover**, swipe right on meals you like, then check **Shop** — ingredients merge automatically. No manual list needed.`,
    };
  }

  const preview = shopItems
    .slice(0, 10)
    .map((i) => `• ${i.name}${i.count > 1 ? ` ×${i.count}` : ""}`)
    .join("\n");

  const text = `Your **Mealdex** has ${saved.length} saved meal(s), which gives you **${shopItems.length}** shopping item(s):

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
• "What can I cook with my inventory?"
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
  try {
    const savedMeals = getSavedMeals(appState).map((meal) => ({
      name: meal.name,
      ingredients: meal.ingredients,
    }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        profile: appState.profile,
        inventory: appState.inventory,
        shoppingList: appState.shoppingList,
        savedMeals,
        recentMessages: appState.chatMessages.slice(-8).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as AIResponse;
      if (data.text?.trim()) {
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
