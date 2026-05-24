import { SEED_MEALS } from "./meal/seedMeals";
import type { AppState } from "./types";

const EMPTY_PROFILE: AppState["profile"] = {
  name: "",
  studentType: "Home cook",
  appliances: [],
  avoidedFoods: [],
  eatingGoals: [],
  cookingSkill: "Beginner",
  availableTime: "",
  simplicityPreference: "",
  profileComplete: false,
};

/** Fresh app state — no prefilled pantry, shopping list, or demo user. */
export function createInitialAppState(): AppState {
  return {
    isLoggedIn: false,
    profile: { ...EMPTY_PROFILE },
    inventory: [],
    meals: SEED_MEALS.map((m) => ({ ...m })),
    swipedMealIds: [],
    savedMealIds: [],
    shoppingList: [],
    chatMessages: [],
    generatedMealPlan: null,
    recipesCreated: 0,
  };
}

export { EMPTY_PROFILE };
