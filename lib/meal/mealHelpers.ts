import { filterMealsForProfile } from "@/lib/meal/mealPersonalization";
import { profileHasSignupData } from "@/lib/signupProfile";
import type { AppState, Meal } from "@/lib/types";

export function getDeckMeals(state: AppState): Meal[] {
  const swiped = new Set(state.swipedMealIds);
  const remaining = state.meals.filter((m) => !swiped.has(m.id));

  if (!profileHasSignupData(state.profile)) {
    return remaining;
  }

  return filterMealsForProfile(remaining, state.profile);
}

export function getSavedMeals(state: AppState): Meal[] {
  const saved = new Set(state.savedMealIds);
  return state.meals.filter((m) => saved.has(m.id));
}

export function swipeLeft(state: AppState, id: string): AppState {
  if (state.swipedMealIds.includes(id)) return state;
  return {
    ...state,
    swipedMealIds: [...state.swipedMealIds, id],
  };
}

export function swipeRight(state: AppState, id: string): AppState {
  if (state.swipedMealIds.includes(id)) return state;
  const savedMealIds = state.savedMealIds.includes(id)
    ? state.savedMealIds
    : [...state.savedMealIds, id];
  return {
    ...state,
    swipedMealIds: [...state.swipedMealIds, id],
    savedMealIds,
  };
}

export function removeFromMealdex(state: AppState, id: string): AppState {
  return {
    ...state,
    savedMealIds: state.savedMealIds.filter((x) => x !== id),
  };
}

export function resetMealSwipes(state: AppState): AppState {
  return {
    ...state,
    swipedMealIds: [],
    savedMealIds: [],
  };
}

export function addCustomMeal(
  state: AppState,
  input: Omit<Meal, "id" | "isCustom">,
): AppState {
  const meal: Meal = {
    ...input,
    id: `custom-${Date.now()}`,
    isCustom: true,
  };
  return {
    ...state,
    meals: [meal, ...state.meals],
  };
}
