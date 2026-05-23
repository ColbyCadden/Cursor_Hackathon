import { SWIPE_DECK_MEALS } from "./mealDeckData";
import type { AppState } from "./types";

export const DEMO_PROFILE: AppState["profile"] = {
  name: "Demo Student",
  studentType: "University student",
  appliances: ["Microwave", "Stove", "Oven", "Air fryer"],
  avoidedFoods: ["None"],
  eatingGoals: ["High protein", "Budget-friendly", "Quick meals"],
  cookingSkill: "Beginner",
  availableTime: "30–45 minutes",
  simplicityPreference: "Simple: 5–7 ingredients",
  profileComplete: false,
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
    category: "Frozen",
    percentLeft: 80,
  },
];

export const DEMO_MEAL_LIBRARY: AppState["mealLibrary"] = [
  {
    id: "deck-1",
    name: "Chicken rice bowl",
    tags: ["high protein", "cheap", "meal prep friendly"],
    estimatedTime: "25 min",
    difficulty: "Easy",
    mainIngredients: ["chicken breast", "rice", "frozen vegetables"],
    requiredAppliance: "stove",
    nutritionEstimate: "~450 kcal",
  },
  {
    id: "deck-4",
    name: "Egg breakfast wrap",
    tags: ["quick", "cheap", "beginner friendly"],
    estimatedTime: "12 min",
    difficulty: "Easy",
    mainIngredients: ["eggs", "tortillas", "cheese"],
    requiredAppliance: "stove",
    nutritionEstimate: "~320 kcal",
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
    mealLibrary: DEMO_MEAL_LIBRARY,
    swipeDeck: SWIPE_DECK_MEALS.map((m) => ({ ...m })),
    swipeIndex: 0,
    shoppingList: DEMO_SHOPPING_LIST,
    chatMessages: [],
  };
}
