import { SEED_MEALS } from "./meal/seedMeals";
import type { AppState, InventoryItem, ShoppingListItem } from "./types";

export const DEMO_PROFILE: AppState["profile"] = {
  name: "Demo Student",
  email: "demo@example.com",
  studentType: "Home cook",
  cooking_equipment: ["microwave", "stovetop", "oven", "air_fryer"],
  eating_habits: "minimal_meat",
  cooking_time_per_week: "3_6h",
  cooking_skill_level: "beginner",
  ingredient_preference: "minimal",
  appliances: ["Microwave", "Stovetop", "Oven", "Air fryer", "Rice cooker"],
  avoidedFoods: ["None"],
  eatingGoals: ["High protein", "Budget-friendly", "Quick meals"],
  cookingSkill: "Beginner",
  availableTime: "30 minutes",
  simplicityPreference: "Very simple",
  profileComplete: true,
};

/** Demo inventory — realistic student staples */
export const DEMO_INVENTORY: InventoryItem[] = [
  {
    id: "demo-inv-rice",
    name: "Rice",
    amount: "2",
    unit: "lb",
    category: "Carbs",
    portionsLeft: 6,
    source: "manual",
  },
  {
    id: "demo-inv-eggs",
    name: "Eggs",
    amount: "12",
    unit: "count",
    category: "Protein",
    portionsLeft: 8,
    source: "manual",
  },
  {
    id: "demo-inv-yogurt",
    name: "Greek yogurt",
    amount: "32",
    unit: "oz",
    category: "Dairy",
    portionsLeft: 5,
    source: "manual",
  },
  {
    id: "demo-inv-broccoli",
    name: "Frozen broccoli",
    amount: "1",
    unit: "bag",
    category: "Frozen",
    portionsLeft: 4,
    source: "manual",
  },
  {
    id: "demo-inv-turkey",
    name: "Turkey slices",
    amount: "8",
    unit: "oz",
    category: "Protein",
    portionsLeft: 3,
    source: "manual",
  },
  {
    id: "demo-inv-oats",
    name: "Oats",
    amount: "18",
    unit: "oz",
    category: "Carbs",
    portionsLeft: 6,
    source: "manual",
  },
];

/** Saved Mealdex card ids for demo (flexible recipe templates) */
export const DEMO_SAVED_MEAL_IDS = [
  "seed-salmon-rice",
  "seed-yogurt-parfait",
  "seed-burrito-bowl",
  "seed-tuna-poke",
];

export const DEMO_SHOPPING_LIST: ShoppingListItem[] = [
  {
    id: "demo-shop-chicken",
    name: "Chicken breast",
    amount: "500",
    unit: "g",
    amountNeeded: "500",
    unitNeeded: "g",
    buyAmount: "4",
    buyUnit: "breasts",
    equivalentAmount: "500",
    equivalentUnit: "g",
    category: "Protein",
    grocerySection: "Meat & Seafood",
    required: true,
    bought: false,
    addedToInventory: false,
    inCart: false,
    usedInRecipes: ["Chicken Rice Bowl", "Chicken Wrap"],
    reason: "Needed for protein bowls",
  },
  {
    id: "demo-shop-tortillas",
    name: "Tortillas",
    amount: "8",
    unit: "count",
    amountNeeded: "8",
    unitNeeded: "count",
    buyAmount: "8",
    buyUnit: "count",
    category: "Carbs",
    grocerySection: "Grains & Bread",
    required: true,
    bought: false,
    addedToInventory: false,
    inCart: false,
    usedInRecipes: ["Burrito Bowl", "Chicken Wrap"],
    reason: "For burrito bowls and wraps",
  },
];

export function createInitialAppState(): AppState {
  return {
    isLoggedIn: false,
    profile: DEMO_PROFILE,
    inventory: DEMO_INVENTORY.map((i) => ({ ...i })),
    meals: SEED_MEALS.map((m) => ({ ...m })),
    swipedMealIds: [...DEMO_SAVED_MEAL_IDS],
    savedMealIds: [...DEMO_SAVED_MEAL_IDS],
    shoppingList: DEMO_SHOPPING_LIST.map((i) => ({ ...i })),
    chatMessages: [],
    generatedMealPlan: null,
  };
}
