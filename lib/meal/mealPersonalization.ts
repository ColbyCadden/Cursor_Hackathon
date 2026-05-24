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
  beginner: 2,
  intermediate: 3,
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

function hasRequiredEquipment(meal: Meal, userEquipment: string[]): boolean {
  const required = meal.requiredEquipment ?? [];
  if (!required.length) return true;
  const owned = new Set(userEquipment);
  return required.every((item) => owned.has(item));
}

function matchesDiet(meal: Meal, eatingHabits?: string): boolean {
  if (eatingHabits !== "no_meat") return true;
  return !meal.containsMeat;
}

function matchesIngredientPreference(meal: Meal, preference?: string): boolean {
  const pref = normalizeIngredientPreference(preference);
  const count = meal.ingredients.length;
  if (pref === "minimal") return count <= INGREDIENT_COUNT_THRESHOLD;
  return count > INGREDIENT_COUNT_THRESHOLD;
}

/** Hard filters — meals that fail are never shown in Discover. */
export function mealMatchesProfile(meal: Meal, profile: UserProfile): boolean {
  const equipment = profile.cooking_equipment ?? [];
  const enriched = enrichMeal(meal);

  if (!hasRequiredEquipment(enriched, equipment)) return false;
  if (!matchesDiet(enriched, profile.eating_habits)) return false;
  if (!matchesIngredientPreference(enriched, profile.ingredient_preference)) {
    return false;
  }

  return true;
}

/** Soft score — higher means better fit for time and skill preferences. */
export function scoreMealForProfile(meal: Meal, profile: UserProfile): number {
  const enriched = enrichMeal(meal);
  let score = 100;

  const preferredMinutes =
    TIME_BUDGET_MINUTES[profile.cooking_time_per_week ?? "3_6h"] ?? 45;
  const minutes = enriched.estimatedMinutes ?? enriched.difficulty * 12 + 10;
  if (minutes > preferredMinutes) {
    score -= Math.min(40, (minutes - preferredMinutes) * 0.8);
  }

  const maxDifficulty =
    SKILL_MAX_DIFFICULTY[profile.cooking_skill_level ?? "beginner"] ?? 2;
  if (enriched.difficulty > maxDifficulty) {
    score -= (enriched.difficulty - maxDifficulty) * 12;
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
