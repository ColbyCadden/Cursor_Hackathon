import type {
  InventoryCategory,
  InventoryItem,
  InventoryUpdate,
  ShoppingListItem,
  SuggestedShoppingItem,
  UserProfile,
} from "@/lib/types";

export interface AIResponse {
  text: string;
  suggestedItems?: SuggestedShoppingItem[];
  mealPrepSteps?: string[];
  inventoryUpdates?: InventoryUpdate[];
  source?: "gemini" | "groq" | "mock" | "quota" | "unconfigured";
}

export interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SavedMealSummary {
  name: string;
  ingredients: string[];
}

export interface ChatRequestBody {
  message: string;
  profile: UserProfile;
  inventory: InventoryItem[];
  shoppingList: ShoppingListItem[];
  savedMeals: SavedMealSummary[];
  recentMessages: ChatApiMessage[];
}

export function buildChatContext(body: ChatRequestBody): string {
  const { profile, inventory, shoppingList, savedMeals } = body;

  const inventoryLine = inventory.length
    ? inventory
        .map(
          (i) =>
            `- ${i.name}: ${i.amount}${i.unit ? ` ${i.unit}` : ""} (${i.category}, ${i.percentLeft}% left)`
        )
        .join("\n")
    : "- (empty)";

  const shoppingLine = shoppingList.length
    ? shoppingList
        .map(
          (i) =>
            `- ${i.name}: ${i.amount}${i.unit ? ` ${i.unit}` : ""}${i.bought ? " [bought]" : ""}`
        )
        .join("\n")
    : "- (empty)";

  const mealdexLine = savedMeals.length
    ? savedMeals
        .map((m) => `- ${m.name}: ${m.ingredients.join(", ")}`)
        .join("\n")
    : "- (none saved yet)";

  return [
    `Student: ${profile.name}`,
    `Skill: ${profile.cookingSkill || profile.cooking_skill_level || "unknown"}`,
    `Time available: ${profile.availableTime || profile.cooking_time_per_week || "unknown"}`,
    `Simplicity preference: ${profile.simplicityPreference || "balanced"}`,
    `Avoided foods: ${profile.avoidedFoods?.filter((f) => f.toLowerCase() !== "none").join(", ") || "none"}`,
    `Equipment: ${(profile.appliances?.length ? profile.appliances : profile.cooking_equipment)?.join(", ") || "basic kitchen"}`,
    "",
    "Kitchen inventory:",
    inventoryLine,
    "",
    "Shopping list:",
    shoppingLine,
    "",
    "Saved Mealdex meals:",
    mealdexLine,
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

export function parseAIResponse(raw: string): AIResponse {
  const trimmed = raw.trim();

  try {
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return { text: trimmed };
    }

    const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as {
      text?: string;
      suggestedItems?: SuggestedShoppingItem[];
      mealPrepSteps?: string[];
      inventoryUpdates?: InventoryUpdate[];
    };

    const text = typeof parsed.text === "string" ? parsed.text.trim() : trimmed;
    if (!text) {
      return { text: trimmed };
    }

    const suggestedItems = Array.isArray(parsed.suggestedItems)
      ? parsed.suggestedItems
          .filter((item) => item?.name?.trim())
          .map((item) => ({
            name: String(item.name).trim(),
            amount: String(item.amount ?? "1").trim(),
            unit: String(item.unit ?? "").trim(),
            category: VALID_CATEGORIES.has(item.category)
              ? (item.category as InventoryCategory)
              : "Other",
            required: Boolean(item.required ?? true),
          }))
      : undefined;

    const mealPrepSteps = Array.isArray(parsed.mealPrepSteps)
      ? parsed.mealPrepSteps.map((s) => String(s).trim()).filter(Boolean)
      : undefined;

    const inventoryUpdates = Array.isArray(parsed.inventoryUpdates)
      ? parsed.inventoryUpdates
          .filter((u) => u?.name?.trim())
          .map((u) => ({
            name: String(u.name).trim(),
            amountUsed: String(u.amountUsed ?? "1").trim(),
            unit: String(u.unit ?? "").trim(),
          }))
      : undefined;

    return {
      text,
      suggestedItems: suggestedItems?.length ? suggestedItems : undefined,
      mealPrepSteps: mealPrepSteps?.length ? mealPrepSteps : undefined,
      inventoryUpdates: inventoryUpdates?.length ? inventoryUpdates : undefined,
    };
  } catch {
    return { text: trimmed };
  }
}

export function buildSystemPrompt(): string {
  return `You are PrepDeck, a friendly meal-prep assistant for busy college students.

Use the student's profile, kitchen inventory, shopping list, and saved Mealdex meals to give practical, budget-conscious advice. Keep answers concise and actionable.

When suggesting groceries the student should buy, include them in suggestedItems with realistic amounts and units.
When giving a prep plan or cooking order, include mealPrepSteps as a numbered-style list (strings only, no numbers required in the string).
When the student completes or plans meal prep, include inventoryUpdates with each ingredient used and realistic amountUsed/unit so pantry stock can be deducted.

Respond with JSON only (no markdown fences), using this exact shape:
{
  "text": "Your reply in plain text or light markdown",
  "suggestedItems": [
    { "name": "Eggs", "amount": "12", "unit": "count", "category": "Protein", "required": true }
  ],
  "mealPrepSteps": ["Cook rice first", "Grill chicken while rice rests"],
  "inventoryUpdates": [
    { "name": "chicken breast", "amountUsed": "200", "unit": "g" }
  ]
}

Rules:
- suggestedItems, mealPrepSteps, and inventoryUpdates are optional; omit or use [] when not needed.
- category must be one of: Protein, Carbs, Produce, Fruit, Dairy, Snacks, Sauces/Spices, Frozen, Other.
- Do not invent inventory the student already has unless suggesting they use it up.
- Respect avoided foods and skill level.`;
}
