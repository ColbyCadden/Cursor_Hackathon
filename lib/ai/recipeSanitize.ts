import type { AdaptedRecipe } from "@/lib/types";

const PLACEHOLDER_STEP =
  /^(step\s*)?(step\s*)?(\d+|one|two|three|four|five)[\s.:,-]*$/i;

export function isPlaceholderStep(step: string): boolean {
  const s = step.trim();
  if (!s || s.length < 10) {
    if (/^step\s*\d+$/i.test(s)) return true;
    if (PLACEHOLDER_STEP.test(s)) return true;
  }
  if (/^step\s*\d+$/i.test(s)) return true;
  if (/^step\s*(one|two|three|four|five)[\s.:,-]*$/i.test(s)) return true;
  return false;
}

export function formatIngredientAmount(amount: string, unit: string): string {
  const a = amount.trim();
  const u = unit.trim();
  if (!a) return u || "";
  if (!u) return a;
  const aLower = a.toLowerCase();
  const uLower = u.toLowerCase();
  if (aLower.endsWith(uLower) && a.length > u.length) return a;
  if (aLower.endsWith(` ${uLower}`)) return a;
  return `${a} ${u}`;
}

export function normalizeIngredientAmountUnit(
  amount: string,
  unit: string
): { amount: string; unit: string } {
  let a = amount.trim();
  const u = unit.trim();
  if (u && a.toLowerCase().endsWith(u.toLowerCase()) && a.length > u.length) {
    a = a.slice(0, -u.length).trim();
  }
  return { amount: a || "1", unit: u };
}

export function generateFallbackSteps(
  recipe: Pick<AdaptedRecipe, "title" | "ingredients">
): string[] {
  const title = recipe.title.toLowerCase();
  const names =
    recipe.ingredients?.map((i) => i.name).filter(Boolean).slice(0, 4) ?? [];
  const ings = names.length ? names.join(", ") : "your ingredients";

  if (title.includes("stir fry") || title.includes("stir-fry")) {
    return [
      "Heat a little oil in a pan on medium-high heat.",
      `Add ${ings} and stir-fry 5–8 minutes until tender-crisp.`,
      "Season with salt, pepper, or soy sauce and serve hot.",
    ];
  }
  if (title.includes("parfait") || title.includes("yogurt")) {
    return [
      "Layer Greek yogurt in a bowl or jar.",
      `Add ${ings} in layers as you like.`,
      "Serve immediately or chill until ready to eat.",
    ];
  }
  if (title.includes("wrap") || title.includes("burrito")) {
    return [
      `Warm the wrap and prep ${ings}.`,
      "Fill the wrap, roll tightly, and optionally toast in a pan 1–2 minutes per side.",
      "Slice in half and serve.",
    ];
  }
  if (title.includes("bowl") || title.includes("rice")) {
    return [
      "Cook or reheat rice if needed.",
      `Prepare ${ings} — cook protein/veg in one pan if using the stove.`,
      "Assemble bowls, season, and portion for meal prep.",
    ];
  }
  if (title.includes("pasta")) {
    return [
      "Boil pasta according to package directions.",
      `Cook ${ings} in a separate pan while pasta boils.`,
      "Toss together, season, and serve.",
    ];
  }

  return [
    `Prep ${ings}.`,
    "Cook on the stove or microwave until everything is done (about 15–20 minutes).",
    "Taste, adjust seasoning, and portion into containers.",
  ];
}

export function sanitizeRecipeSteps(
  steps: unknown,
  recipe: Pick<AdaptedRecipe, "title" | "ingredients">
): string[] | undefined {
  const cleaned = Array.isArray(steps)
    ? steps
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0 && !isPlaceholderStep(s))
    : [];

  if (cleaned.length > 0) return cleaned.slice(0, 5);
  return generateFallbackSteps(recipe);
}

export function sanitizeStepList(steps: unknown): string[] | undefined {
  if (!Array.isArray(steps)) return undefined;
  const cleaned = steps
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0 && !isPlaceholderStep(s));
  return cleaned.length ? cleaned : undefined;
}
