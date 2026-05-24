import { normalizeIngredientName } from "./inventoryMatching";

/** Meal ingredient → keywords that appear on real product labels. */
export const INGREDIENT_ALIASES: Record<string, string[]> = {
  "chicken breast": ["chicken", "poultry", "breast"],
  "chicken thigh": ["chicken", "poultry", "thigh"],
  "salmon fillet": ["salmon", "fish"],
  "sushi-grade tuna": ["tuna", "fish"],
  "ground beef": ["beef", "mince", "burger"],
  "ribeye or sirloin steak": ["steak", "ribeye", "sirloin", "beef"],
  "guanciale or bacon": ["bacon", "guanciale", "pancetta", "pork"],
  "mixed greens": ["greens", "lettuce", "salad", "spinach", "arugula", "kale"],
  "cherry tomatoes": ["tomato", "tomatoes"],
  tomatoes: ["tomato"],
  "bell pepper": ["pepper", "capsicum"],
  "snap peas": ["peas", "snap"],
  "black beans": ["beans", "black bean"],
  "brown rice": ["rice"],
  "jasmine rice": ["rice", "jasmine"],
  "basmati rice": ["rice", "basmati"],
  "sushi rice": ["rice"],
  rice: ["rice"],
  spaghetti: ["spaghetti", "pasta"],
  pasta: ["pasta", "spaghetti", "noodles"],
  "ramen noodles": ["ramen", "noodles"],
  eggs: ["egg", "eggs"],
  egg: ["egg", "eggs"],
  "soft-boiled egg": ["egg", "eggs"],
  "pecorino cheese": ["pecorino", "cheese", "parmesan"],
  "fresh mozzarella": ["mozzarella", "cheese"],
  mozzarella: ["mozzarella", "cheese"],
  "cheddar cheese": ["cheddar", "cheese"],
  "greek yogurt": ["yogurt", "yoghurt"],
  yogurt: ["yogurt", "yoghurt"],
  "olive oil": ["olive"],
  "soy sauce": ["soy"],
  "sesame oil": ["sesame"],
  broccoli: ["broccoli"],
  carrot: ["carrot"],
  cucumber: ["cucumber"],
  avocado: ["avocado"],
  lemon: ["lemon"],
  lime: ["lime"],
  garlic: ["garlic"],
  ginger: ["ginger"],
  onion: ["onion"],
  spinach: ["spinach"],
  corn: ["corn", "maize"],
  lettuce: ["lettuce"],
  potato: ["potato"],
  "yukon potatoes": ["potato", "potatoes"],
  berries: ["berry", "berries", "strawberr", "blueberr", "raspberr"],
  honey: ["honey"],
  granola: ["granola", "oats", "cereal"],
  tofu: ["tofu"],
  bacon: ["bacon"],
  butter: ["butter"],
  milk: ["milk"],
  bread: ["bread"],
  "sourdough bread": ["sourdough", "bread"],
  "burger bun": ["bun", "roll", "bread"],
  "flour tortillas": ["tortilla", "wrap"],
  "pizza dough": ["pizza", "dough"],
  pepperoni: ["pepperoni"],
  sausage: ["sausage"],
  shrimp: ["shrimp", "prawn"],
  tuna: ["tuna"],
  salmon: ["salmon"],
  chicken: ["chicken", "poultry"],
};

const PRODUCT_NOISE = new Set([
  "boneless",
  "skinless",
  "fresh",
  "organic",
  "natural",
  "classic",
  "original",
  "style",
  "free",
  "range",
  "grade",
  "premium",
  "select",
  "whole",
  "raw",
  "cooked",
  "frozen",
  "sliced",
  "diced",
  "chunk",
  "chunks",
  "pieces",
  "fillet",
  "fillets",
  "breast",
  "breasts",
  "thigh",
  "thighs",
]);

export function getMatchTerms(ingredientName: string): string[] {
  const norm = normalizeIngredientName(ingredientName);
  const aliasList = INGREDIENT_ALIASES[norm] ?? [];
  const words = norm
    .split(" ")
    .filter((w) => w.length > 2 && !PRODUCT_NOISE.has(w));

  return [...new Set([norm, ...words, ...aliasList])];
}

/** Derive searchable tags from a scanned product name + category. */
export function deriveIngredientTags(
  productName: string,
  category?: string
): string[] {
  const norm = normalizeIngredientName(productName);
  const tags = new Set<string>();

  for (const word of norm.split(" ")) {
    if (word.length > 2 && !PRODUCT_NOISE.has(word)) {
      tags.add(word);
    }
  }

  for (const [ingredient, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    const allTerms = [ingredient, ...aliases];
    const productMatches = allTerms.some(
      (term) => term.length >= 3 && termMatchesProduct(term, norm)
    );
    if (productMatches) {
      tags.add(ingredient);
      for (const alias of aliases) {
        if (alias.length >= 3) tags.add(alias);
      }
    }
  }

  const cat = (category ?? "").toLowerCase();
  if (/chicken|poultry/.test(norm) || cat === "protein") {
    if (/chicken|poultry/.test(norm)) tags.add("chicken");
  }
  if (/rice/.test(norm)) tags.add("rice");
  if (/pasta|spaghetti|noodle|ramen/.test(norm)) tags.add("pasta");
  if (/egg/.test(norm)) tags.add("eggs");
  if (/salmon/.test(norm)) tags.add("salmon");
  if (/tuna/.test(norm)) tags.add("tuna");
  if (/beef|steak|burger/.test(norm)) tags.add("beef");
  if (/cheese|mozzarella|cheddar|pecorino/.test(norm)) tags.add("cheese");
  if (/yogurt|yoghurt/.test(norm)) tags.add("yogurt");
  if (/tomato/.test(norm)) tags.add("tomato");
  if (/bean/.test(norm)) tags.add("beans");

  return [...tags];
}

export function termMatchesProduct(term: string, productNorm: string): boolean {
  if (term.length < 3) return false;

  const words = productNorm.split(/\s+/).filter(Boolean);

  if (words.some((w) => w === term)) return true;

  if (term.includes(" ") && productNorm.includes(term)) return true;

  if (term.length >= 4) {
    if (words.some((w) => w.startsWith(term) || term.startsWith(w))) return true;
  }

  return false;
}

export function scoreIngredientToProduct(
  ingredientName: string,
  productName: string,
  productTags?: string[]
): number {
  const needle = normalizeIngredientName(ingredientName);
  const hay = normalizeIngredientName(productName);
  if (!needle || !hay) return 0;

  if (hay === needle) return 100;
  if (needle.includes(" ") && (hay.includes(needle) || needle.includes(hay))) {
    return 85;
  }

  const terms = getMatchTerms(ingredientName);
  let score = 0;

  for (const term of terms) {
    if (termMatchesProduct(term, hay)) {
      score += term === needle ? 40 : 20;
    }
  }

  if (productTags?.length) {
    for (const term of terms) {
      if (productTags.some((tag) => tag === term || termMatchesProduct(term, tag))) {
        score += 25;
      }
    }
  }

  return score;
}
