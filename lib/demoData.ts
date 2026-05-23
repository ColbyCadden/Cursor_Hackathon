import type { AppState } from "./types";

export const DEMO_PROFILE: AppState["profile"] = {
  name: "Demo Student",
  studentType: "University student",
  appliances: ["microwave", "stove", "oven", "air fryer"],
  avoidedFoods: ["none"],
  eatingGoals: ["high protein", "budget-friendly", "quick meals"],
  cookingSkill: "Beginner",
  availableTime: "30–45 minutes",
  simplicityPreference: "Simple meals with fewer ingredients",
};

export const DEMO_INVENTORY: AppState["inventory"] = [
  {
    id: "inv-1",
    name: "Chicken breast",
    amount: "500",
    unit: "g",
    category: "Protein",
    percentLeft: 75,
  },
  {
    id: "inv-2",
    name: "Rice",
    amount: "2",
    unit: "cups",
    category: "Carbs",
    percentLeft: 60,
  },
  {
    id: "inv-3",
    name: "Eggs",
    amount: "6",
    unit: "",
    category: "Protein",
    percentLeft: 50,
  },
  {
    id: "inv-4",
    name: "Frozen vegetables",
    amount: "1",
    unit: "bag",
    category: "Produce",
    percentLeft: 80,
  },
];

export const DEMO_MEALS: AppState["meals"] = [
  {
    id: "meal-1",
    name: "Chicken rice bowl",
    tags: ["high protein", "meal prep", "budget"],
    estimatedTime: "25 min",
    difficulty: "Easy",
    mainIngredients: ["chicken breast", "rice", "frozen vegetables"],
    requiredAppliance: "stove",
    nutritionEstimate: "~450 kcal",
    saved: true,
  },
  {
    id: "meal-2",
    name: "Egg breakfast wrap",
    tags: ["quick", "breakfast", "simple"],
    estimatedTime: "12 min",
    difficulty: "Easy",
    mainIngredients: ["eggs", "tortillas", "frozen vegetables"],
    requiredAppliance: "stove",
    nutritionEstimate: "~320 kcal",
    saved: true,
  },
];

export const DEMO_SHOPPING_LIST: AppState["shoppingList"] = [
  {
    id: "shop-1",
    name: "Chicken breast",
    amount: "1",
    unit: "kg",
    category: "Protein",
    required: true,
    bought: false,
    addedToInventory: false,
  },
  {
    id: "shop-2",
    name: "Tortillas",
    amount: "1",
    unit: "pack",
    category: "Carbs",
    required: true,
    bought: false,
    addedToInventory: false,
  },
  {
    id: "shop-3",
    name: "Frozen vegetables",
    amount: "1",
    unit: "bag",
    category: "Produce",
    required: true,
    bought: false,
    addedToInventory: false,
  },
  {
    id: "shop-4",
    name: "Sauce",
    amount: "1",
    unit: "bottle",
    category: "Other",
    required: false,
    bought: false,
    addedToInventory: false,
  },
];

export function createInitialAppState(): AppState {
  return {
    isLoggedIn: false,
    profile: DEMO_PROFILE,
    inventory: DEMO_INVENTORY,
    meals: DEMO_MEALS,
    shoppingList: DEMO_SHOPPING_LIST,
    chatMessages: [],
  };
}
