import type { Meal, MergedMealIngredient } from "@/lib/types";

function normalizeIngredient(name: string): string {
  return name.trim().toLowerCase();
}

export function buildMealdexShoppingList(meals: Meal[]): MergedMealIngredient[] {
  const map = new Map<string, MergedMealIngredient>();

  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const key = normalizeIngredient(ingredient);
      if (!key) continue;

      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.mealNames.includes(meal.name)) {
          existing.mealNames.push(meal.name);
        }
      } else {
        map.set(key, {
          name: ingredient.trim(),
          count: 1,
          mealNames: [meal.name],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
