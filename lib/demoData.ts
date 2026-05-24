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

export function createInitialAppState(): AppState {
  return {
    isLoggedIn: false,
    profile: DEMO_PROFILE,
    inventory: [],
    meals: SEED_MEALS.map((m) => ({ ...m })),
    swipedMealIds: [],
    savedMealIds: [],
    shoppingList: [],
    chatMessages: [],
  };
}
