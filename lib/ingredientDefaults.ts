import { normalizeIngredientName } from "./inventoryMatching";
import type { InventoryCategory } from "./types";

export interface IngredientDefault {
  amount: string;
  unit: string;
  category: InventoryCategory;
}

const DEFAULTS: Record<string, IngredientDefault> = {
  "chicken breast": { amount: "200", unit: "g", category: "Protein" },
  chicken: { amount: "200", unit: "g", category: "Protein" },
  salmon: { amount: "150", unit: "g", category: "Protein" },
  tuna: { amount: "1", unit: "can", category: "Protein" },
  eggs: { amount: "2", unit: "count", category: "Protein" },
  egg: { amount: "2", unit: "count", category: "Protein" },
  tofu: { amount: "200", unit: "g", category: "Protein" },
  bacon: { amount: "100", unit: "g", category: "Protein" },
  "guanciale or bacon": { amount: "100", unit: "g", category: "Protein" },
  beef: { amount: "200", unit: "g", category: "Protein" },
  shrimp: { amount: "150", unit: "g", category: "Protein" },
  rice: { amount: "150", unit: "g", category: "Carbs" },
  pasta: { amount: "100", unit: "g", category: "Carbs" },
  spaghetti: { amount: "100", unit: "g", category: "Carbs" },
  bread: { amount: "2", unit: "slices", category: "Carbs" },
  tortilla: { amount: "2", unit: "count", category: "Carbs" },
  oats: { amount: "80", unit: "g", category: "Carbs" },
  potato: { amount: "2", unit: "count", category: "Carbs" },
  broccoli: { amount: "150", unit: "g", category: "Produce" },
  "bell pepper": { amount: "1", unit: "count", category: "Produce" },
  carrot: { amount: "1", unit: "count", category: "Produce" },
  "snap peas": { amount: "100", unit: "g", category: "Produce" },
  garlic: { amount: "2", unit: "cloves", category: "Produce" },
  ginger: { amount: "1", unit: "tbsp", category: "Produce" },
  onion: { amount: "1", unit: "count", category: "Produce" },
  spinach: { amount: "100", unit: "g", category: "Produce" },
  "mixed greens": { amount: "100", unit: "g", category: "Produce" },
  "cherry tomatoes": { amount: "150", unit: "g", category: "Produce" },
  cucumber: { amount: "0.5", unit: "count", category: "Produce" },
  avocado: { amount: "1", unit: "count", category: "Fruit" },
  lemon: { amount: "1", unit: "count", category: "Fruit" },
  lime: { amount: "1", unit: "count", category: "Fruit" },
  banana: { amount: "1", unit: "count", category: "Fruit" },
  cheese: { amount: "50", unit: "g", category: "Dairy" },
  "pecorino cheese": { amount: "50", unit: "g", category: "Dairy" },
  milk: { amount: "250", unit: "ml", category: "Dairy" },
  butter: { amount: "30", unit: "g", category: "Dairy" },
  yogurt: { amount: "150", unit: "g", category: "Dairy" },
  "olive oil": { amount: "2", unit: "tbsp", category: "Sauces/Spices" },
  "soy sauce": { amount: "2", unit: "tbsp", category: "Sauces/Spices" },
  "sesame oil": { amount: "1", unit: "tbsp", category: "Sauces/Spices" },
  salt: { amount: "1", unit: "tsp", category: "Sauces/Spices" },
  pepper: { amount: "1", unit: "tsp", category: "Sauces/Spices" },
  "black pepper": { amount: "1", unit: "tsp", category: "Sauces/Spices" },
};

const FALLBACK: IngredientDefault = {
  amount: "1",
  unit: "serving",
  category: "Other",
};

export function getDefaultForIngredient(name: string): IngredientDefault {
  const key = normalizeIngredientName(name);
  return DEFAULTS[key] ?? FALLBACK;
}
