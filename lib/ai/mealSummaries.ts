import type { Meal } from "@/lib/types";

export interface SavedMealSummary {
  id: string;
  name: string;
  ingredients: string[];
  tags: string[];
  difficulty: number;
  estimatedMinutes?: number;
  highProtein: boolean;
  requiredEquipment?: string[];
}

export function mealToTags(meal: Meal): string[] {
  const tags: string[] = [];
  if (meal.highProtein) tags.push("high protein");
  if (meal.highVegetables) tags.push("high vegetables");
  if (meal.price <= 2) tags.push("cheap");
  if (meal.price >= 4) tags.push("premium");
  if (meal.difficulty <= 2) tags.push("beginner friendly");
  if (meal.difficulty >= 4) tags.push("advanced");
  if ((meal.estimatedMinutes ?? 99) <= 25) tags.push("quick");
  if (!meal.containsMeat) tags.push("vegetarian-friendly");
  return tags;
}

export function mealToSummary(meal: Meal): SavedMealSummary {
  return {
    id: meal.id,
    name: meal.name,
    ingredients: meal.ingredients,
    tags: mealToTags(meal),
    difficulty: meal.difficulty,
    estimatedMinutes: meal.estimatedMinutes,
    highProtein: meal.highProtein,
    requiredEquipment: meal.requiredEquipment,
  };
}
