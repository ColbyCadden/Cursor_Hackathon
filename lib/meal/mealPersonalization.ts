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

function hasRequiredEquipment(meal: Meal, equipment: string[]): boolean {
  const required = meal.requiredEquipment ?? [];
  if (required.length === 0) return true;
  return required.every((item) => equipment.includes(item));
}

/** Hard filters — diet and equipment remove cards from Discover entirely. */
export function mealMatchesProfile(meal: Meal, profile: UserProfile): boolean {
  const enriched = enrichMeal(meal);
  if (!matchesDiet(enriched, profile.eating_habits)) return false;

  const equipment = profile.cooking_equipment ?? [];
  return hasRequiredEquipment(enriched, equipment);
}

/** Soft score — higher means better fit; used for ordering, not hiding meals. */
export function scoreMealForProfile(meal: Meal, profile: UserProfile): number {
  const enriched = enrichMeal(meal);
  let score = 50;

  const pref = normalizeIngredientPreference(profile.ingredient_preference);
  const count = enriched.ingredients.length;
  if (pref === "minimal") {
    if (count <= INGREDIENT_COUNT_THRESHOLD) score += 4;
    else if (count > INGREDIENT_COUNT_THRESHOLD + 1) score -= 3;
  } else if (count >= INGREDIENT_COUNT_THRESHOLD) {
    score += 4;
  } else if (count < INGREDIENT_COUNT_THRESHOLD) {
    score -= 3;
  }

  const preferredMinutes =
    TIME_BUDGET_MINUTES[profile.cooking_time_per_week ?? "3_6h"] ?? 45;
  const minutes = enriched.estimatedMinutes ?? enriched.difficulty * 12 + 10;
  if (minutes <= preferredMinutes) {
    score += 3;
  } else {
    score -= Math.min(6, (minutes - preferredMinutes) * 0.12);
  }

  const maxDifficulty =
    SKILL_MAX_DIFFICULTY[profile.cooking_skill_level ?? "beginner"] ?? 3;
  if (enriched.difficulty <= maxDifficulty) {
    score += 3;
  } else {
    score -= (enriched.difficulty - maxDifficulty) * 2;
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
