import { getSavedMeals } from "@/lib/meal/mealHelpers";
import { mealToTags } from "@/lib/ai/mealSummaries";
import type { AIResponse } from "@/lib/ai/chatHelpers";
import type { AppState } from "@/lib/types";

/** Instant replies from app data — no API call, no duplicates, always accurate. */
export function tryLocalChatReply(
  userMessage: string,
  appState: AppState
): AIResponse | null {
  const m = userMessage.toLowerCase().trim();

  if (
    /inventory|invern|what'?s in my (kitchen|fridge|pantry)|what do i have|list everything|what food/.test(
      m
    )
  ) {
    const { inventory } = appState;
    if (!inventory.length) {
      return {
        text: "Your pantry is empty right now. Scan items on the Scanner page or add them from Pantry.",
        source: "local",
      };
    }
    const lines = inventory.map(
      (i) =>
        `• ${i.name} — ${i.amount} ${i.unit} (${i.category}, ${i.portionsLeft} portion${i.portionsLeft === 1 ? "" : "s"} left)`
    );
    return {
      text: `Here's everything in your pantry (${inventory.length} items):\n\n${lines.join("\n")}`,
      source: "local",
    };
  }

  if (/shopping list|what.*(need to )?buy|on my list/.test(m)) {
    const open = appState.shoppingList.filter((i) => !i.bought);
    if (!open.length) {
      return {
        text: "Your shopping list is empty (or everything is marked bought). Ask me to suggest missing ingredients for a meal plan.",
        source: "local",
      };
    }
    const lines = open.map(
      (i) =>
        `• ${i.name} — ${i.amount} ${i.unit}${i.required ? "" : " (optional)"}${i.reason ? ` — ${i.reason}` : ""}`
    );
    return {
      text: `Here's your shopping list (${open.length} items to buy):\n\n${lines.join("\n")}`,
      source: "local",
    };
  }

  if (/saved meal|mealdex|my cards|saved cards/.test(m) && /list|show|what/.test(m)) {
    const saved = getSavedMeals(appState);
    if (!saved.length) {
      return {
        text: "You haven't saved any meals yet. Swipe right on Discover to build your Mealdeck.",
        source: "local",
      };
    }
    const lines = saved.map(
      (meal) => `• ${meal.name} (${mealToTags(meal).join(", ") || "meal template"})`
    );
    return {
      text: `Your saved Mealdeck cards (${saved.length}):\n\n${lines.join("\n")}\n\nThese are flexible templates — ask me to turn them into a meal plan.`,
      source: "local",
    };
  }

  return null;
}
