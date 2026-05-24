import { SEED_MEALS } from "./meal/seedMeals";
import type { AppState } from "./types";

export const DEMO_PROFILE: AppState["profile"] = {
  name: "Demo Student",
  email: "demo@university.edu",
  studentType: "University student",
  cooking_equipment: ["microwave", "stovetop", "oven", "air_fryer"],
  eating_habits: "minimal_meat",
  cooking_time_per_week: "3_6h",
  cooking_skill_level: "beginner",
  ingredient_preference: "balanced",
  appliances: ["Microwave", "Stove", "Oven", "Air fryer"],
  avoidedFoods: ["None"],
  eatingGoals: ["High protein", "Budget-friendly", "Quick meals"],
  cookingSkill: "Beginner",
  availableTime: "30–45 minutes",
  simplicityPreference: "Simple: 5–7 ingredients",
  profileComplete: true,
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

export function createInitialAppState(): AppState {
  return {
    isLoggedIn: false,
    profile: DEMO_PROFILE,
    inventory: DEMO_INVENTORY,
    meals: SEED_MEALS.map((m) => ({ ...m })),
    swipedMealIds: [],
    savedMealIds: ["seed-grilled-chicken-salad", "seed-burrito-bowl"],
    shoppingList: [],
    chatMessages: [],
  };
}
