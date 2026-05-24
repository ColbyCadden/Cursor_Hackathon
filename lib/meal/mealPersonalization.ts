import { INGREDIENT_COUNT_THRESHOLD } from "@/lib/signupConstants";
import type { Meal, UserProfile } from "@/lib/types";

const MEAT_KEYWORDS = [
  "chicken",
  "beef",
  "pork",
  "bacon",
  "steak",
  "guanciale",
  "tuna",
  "salmon",
  "fish",
  "lamb",
  "turkey",
  "sausage",
  "ham",
  "shrimp",
  "prawn",
  "meat",
  "ribeye",
  "sirloin",
];

const TIME_BUDGET_MINUTES: Record<string, number> = {
  under_3h: 30,
  "3_6h": 45,
  "6_10h": 60,
  over_10h: 90,
};

const SKILL_MAX_DIFFICULTY: Record<string, number> = {
  beginner: 3,
  intermediate: 4,
  confident: 5,
};

export function normalizeIngredientPreference(pref?: string): "minimal" | "lots" {
  return pref === "lots" ? "lots" : "minimal";
}

export function inferContainsMeat(ingredients: string[]): boolean {
  const haystack = ingredients.join(" ").toLowerCase();
  return MEAT_KEYWORDS.some((word) => haystack.includes(word));
}

export function enrichMeal(meal: Meal, seed?: Meal): Meal {
  const base = seed ?? meal;
  return {
    ...meal,
    requiredEquipment: meal.requiredEquipment ?? base.requiredEquipment ?? [],
    containsMeat:
      meal.containsMeat ?? base.containsMeat ?? inferContainsMeat(meal.ingredients),
    estimatedMinutes:
      meal.estimatedMinutes ?? base.estimatedMinutes ?? meal.difficulty * 12 + 10,
  };
}

function matchesDiet(meal: Meal, eatingHabits?: string): boolean {
  if (eatingHabits !== "no_meat") return true;
  return !meal.containsMeat;
}

/** Hard filters — only strict diet rules remove cards from Discover. */
export function mealMatchesProfile(meal: Meal, profile: UserProfile): boolean {
  const enriched = enrichMeal(meal);
  return matchesDiet(enriched, profile.eating_habits);
}

/** Soft score — higher means better fit; used for ordering, not hiding meals. */
export function scoreMealForProfile(meal: Meal, profile: UserProfile): number {
  const enriched = enrichMeal(meal);
  let score = 100;

  const equipment = profile.cooking_equipment ?? [];
  const required = enriched.requiredEquipment ?? [];
  for (const item of required) {
    if (!equipment.includes(item)) {
      score -= 12;
    }
  }

  const pref = normalizeIngredientPreference(profile.ingredient_preference);
  const count = enriched.ingredients.length;
  if (pref === "minimal" && count > INGREDIENT_COUNT_THRESHOLD + 1) {
    score -= 10;
  }
  if (pref === "lots" && count < INGREDIENT_COUNT_THRESHOLD) {
    score -= 8;
  }

  const preferredMinutes =
    TIME_BUDGET_MINUTES[profile.cooking_time_per_week ?? "3_6h"] ?? 45;
  const minutes = enriched.estimatedMinutes ?? enriched.difficulty * 12 + 10;
  if (minutes > preferredMinutes) {
    score -= Math.min(25, (minutes - preferredMinutes) * 0.5);
  }

  const maxDifficulty =
    SKILL_MAX_DIFFICULTY[profile.cooking_skill_level ?? "beginner"] ?? 3;
  if (enriched.difficulty > maxDifficulty) {
    score -= (enriched.difficulty - maxDifficulty) * 8;
  }

  return score;
}

export function sortMealsForProfile(meals: Meal[], profile: UserProfile): Meal[] {
  return [...meals].sort(
    (a, b) => scoreMealForProfile(b, profile) - scoreMealForProfile(a, profile),
  );
}

export function filterMealsForProfile(meals: Meal[], profile: UserProfile): Meal[] {
  return sortMealsForProfile(
    meals.filter((meal) => mealMatchesProfile(meal, profile)),
    profile,
  );
}
