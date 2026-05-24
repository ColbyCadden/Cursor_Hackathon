import { createInitialAppState } from "./demoData";
import { registerUser, type RegisteredUser } from "./auth";
import { normalizeIngredientPreference } from "./meal/mealPersonalization";
import {
  COOKING_EQUIPMENT,
  COOKING_SKILL,
  COOKING_TIME_PER_WEEK,
  EATING_HABITS,
  INGREDIENT_PREFERENCE,
} from "./signupConstants";
import type { PendingSignup } from "./signupSession";
import { clearPendingSignup } from "./signupSession";
import type { AppState, UserProfile } from "./types";
import { saveAppState } from "./storage";

const SKILL_MAP: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  confident: "Advanced",
};

const INGREDIENT_TO_SIMPLICITY: Record<string, string> = {
  minimal: "Simple recipes with fewer ingredients",
  lots: "Fuller recipes with more ingredients",
};

const DIET_TO_GOALS: Record<string, string[]> = {
  lots_meat: ["High protein", "Budget-friendly"],
  minimal_meat: ["Budget-friendly", "Quick meals"],
  no_meat: ["Vegetarian", "Healthy"],
};

export function pendingSignupToProfile(pending: PendingSignup): UserProfile {
  const equipmentKeys = pending.cooking_equipment ?? [];
  const equipment = equipmentKeys.map((key) => COOKING_EQUIPMENT[key] ?? key);
  const diet = pending.eating_habits ?? "minimal_meat";
  const skill = pending.cooking_skill_level ?? "beginner";
  const timeBudget = pending.cooking_time_per_week ?? "3_6h";
  const ingredients = normalizeIngredientPreference(pending.ingredient_preference);

  return {
    name: pending.name ?? "Student",
    email: pending.email,
    studentType: "Home cook",
    cooking_equipment: equipmentKeys,
    eating_habits: diet,
    cooking_time_per_week: timeBudget,
    cooking_skill_level: skill,
    ingredient_preference: ingredients,
    appliances: equipment.length ? equipment : ["Microwave"],
    avoidedFoods: diet === "no_meat" ? ["Meat"] : ["None"],
    eatingGoals: DIET_TO_GOALS[diet] ?? ["Quick meals"],
    cookingSkill: SKILL_MAP[skill] ?? "Beginner",
    availableTime: COOKING_TIME_PER_WEEK[timeBudget] ?? "3–6 hours",
    simplicityPreference:
      INGREDIENT_TO_SIMPLICITY[ingredients] ??
      "Simple recipes with fewer ingredients",
    profileComplete: true,
  };
}

export function registeredUserToProfile(user: RegisteredUser): UserProfile {
  return pendingSignupToProfile({
    email: user.email,
    password: user.password,
    name: user.name,
    cooking_equipment: user.cooking_equipment,
    eating_habits: user.eating_habits,
    cooking_time_per_week: user.cooking_time_per_week,
    cooking_skill_level: user.cooking_skill_level,
    ingredient_preference: user.ingredient_preference,
  });
}

export function buildPersonalizedExperience(profile: UserProfile) {
  const diet =
    EATING_HABITS[profile.eating_habits ?? "minimal_meat"] ?? "your diet";
  const time =
    COOKING_TIME_PER_WEEK[profile.cooking_time_per_week ?? "3_6h"] ??
    profile.availableTime;
  const skill =
    COOKING_SKILL[profile.cooking_skill_level ?? "beginner"] ??
    profile.cookingSkill;
  const ingredientKey = normalizeIngredientPreference(profile.ingredient_preference);
  const ingredients =
    INGREDIENT_PREFERENCE[ingredientKey] ?? profile.simplicityPreference;

  const equipmentKeys = profile.cooking_equipment ?? [];
  const equipmentNames = equipmentKeys.map((key) => COOKING_EQUIPMENT[key] ?? key);
  const equipmentSummary = equipmentNames.slice(0, 3).join(", ");
  const equipmentDisplay =
    equipmentNames.length > 3
      ? `${equipmentSummary} +${equipmentNames.length - 3} more`
      : equipmentSummary || "Not set";

  return {
    greeting: `Hey ${profile.name}, your PrepDeck is ready`,
    subtitle:
      "Swipe meals, track your pantry, and build smarter shopping lists — PrepDeck keeps your kitchen organized in one place.",
    stats: {
      diet,
      time,
      skill,
      ingredients,
      equipment: equipmentDisplay,
      equipmentCount: equipmentKeys.length,
    },
  };
}

export function profileHasSignupData(profile: UserProfile): boolean {
  return Boolean(
    profile.profileComplete &&
      profile.cooking_equipment?.length &&
      profile.eating_habits &&
      profile.cooking_time_per_week &&
      profile.cooking_skill_level &&
      profile.ingredient_preference
  );
}

export function completeSignup(pending: PendingSignup): AppState {
  if (
    !pending.email ||
    !pending.password ||
    !pending.name ||
    !pending.cooking_equipment?.length ||
    !pending.eating_habits ||
    !pending.cooking_time_per_week ||
    !pending.cooking_skill_level ||
    !pending.ingredient_preference
  ) {
    throw new Error("Signup is incomplete.");
  }

  registerUser({
    email: pending.email,
    password: pending.password,
    name: pending.name,
    cooking_equipment: pending.cooking_equipment,
    eating_habits: pending.eating_habits,
    cooking_time_per_week: pending.cooking_time_per_week,
    cooking_skill_level: pending.cooking_skill_level,
    ingredient_preference: pending.ingredient_preference,
    onboarding_completed: true,
  });

  const initial = createInitialAppState();
  const profile = pendingSignupToProfile(pending);

  const state: AppState = {
    ...initial,
    isLoggedIn: true,
    profile,
  };

  saveAppState(state);
  clearPendingSignup();
  return state;
}
