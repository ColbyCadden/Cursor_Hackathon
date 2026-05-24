import { createInitialAppState } from "./demoData";
import { SEED_MEALS } from "./meal/seedMeals";
import { authenticateUser } from "./auth";
import { clearPendingSignup } from "./signupSession";
import { registeredUserToProfile } from "./signupProfile";
import { migrateShoppingCategory } from "./shoppingCategories";
import type {
  AppState,
  LegacyAppState,
  Meal,
  ShoppingListItem,
  UserProfile,
} from "./types";

const STORAGE_KEY = "prepdeck-app-state";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function migrateProfile(profile: Partial<UserProfile>): UserProfile {
  const base = createInitialAppState().profile;
  return {
    ...base,
    ...profile,
    profileComplete: profile.profileComplete ?? false,
  };
}

function migrateShoppingList(items: ShoppingListItem[]): ShoppingListItem[] {
  return items.map((item) => ({
    ...item,
    category: migrateShoppingCategory(item.category),
    bought: item.bought ?? false,
    addedToInventory: item.addedToInventory ?? false,
    required: item.required ?? true,
  }));
}

function hasMealShape(m: unknown): m is Meal {
  return (
    typeof m === "object" &&
    m !== null &&
    "imageUri" in m &&
    "ingredients" in m &&
    typeof (m as Meal).imageUri === "string"
  );
}

function migrateMeals(parsed: LegacyAppState): Meal[] {
  const rawMeals = (parsed.meals ?? []).filter(hasMealShape) as Meal[];
  const seedIds = new Set(SEED_MEALS.map((m) => m.id));
  const customs = rawMeals.filter((m) => m.isCustom || !seedIds.has(m.id));

  const mergedSeeds = SEED_MEALS.map((seed) => {
    const existing = rawMeals.find((m) => m.id === seed.id);
    return existing ? { ...existing, ...seed } : seed;
  });

  return [...customs, ...mergedSeeds];
}

function migrateSwipedIds(parsed: LegacyAppState): string[] {
  if (parsed.swipedMealIds?.length) {
    return parsed.swipedMealIds;
  }

  const swiped: string[] = [];
  if (parsed.swipeDeck && typeof parsed.swipeIndex === "number") {
    for (let i = 0; i < parsed.swipeIndex && i < parsed.swipeDeck.length; i++) {
      swiped.push(parsed.swipeDeck[i].id);
    }
  }
  return swiped;
}

function migrateSavedIds(parsed: LegacyAppState): string[] {
  if (parsed.savedMealIds?.length) {
    return parsed.savedMealIds;
  }
  return parsed.mealLibrary?.map((m) => m.id) ?? [];
}

function migrateParsedState(parsed: LegacyAppState): AppState {
  const initial = createInitialAppState();

  const shoppingList = parsed.shoppingList?.length
    ? migrateShoppingList(parsed.shoppingList)
    : initial.shoppingList;

  return {
    isLoggedIn: parsed.isLoggedIn ?? false,
    profile: migrateProfile(parsed.profile ?? {}),
    inventory: parsed.inventory ?? [],
    meals: migrateMeals(parsed),
    swipedMealIds: migrateSwipedIds(parsed),
    savedMealIds: migrateSavedIds(parsed),
    shoppingList,
    chatMessages: (parsed.chatMessages ?? []).map((msg) => ({
      ...msg,
      suggestedItems: msg.suggestedItems ?? undefined,
      mealPrepSteps: msg.mealPrepSteps ?? undefined,
      suggestedItemsAdded: msg.suggestedItemsAdded ?? false,
    })),
  };
}

export function getAppState(): AppState {
  if (!isBrowser()) {
    return createInitialAppState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialAppState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as LegacyAppState;
    return migrateParsedState(parsed);
  } catch {
    const initial = createInitialAppState();
    saveAppState(initial);
    return initial;
  }
}

export function saveAppState(state: AppState): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoData(): AppState {
  const state = createInitialAppState();
  const current = getAppState();
  state.isLoggedIn = current.isLoggedIn;
  saveAppState(state);
  return state;
}

export function loginDemoUser(): AppState {
  const initial = createInitialAppState();
  const state: AppState = {
    ...initial,
    isLoggedIn: true,
    profile: initial.profile,
  };
  saveAppState(state);
  return state;
}

export function loginWithCredentials(
  email: string,
  password: string
): { ok: true; state: AppState } | { ok: false; error: string } {
  const user = authenticateUser(email, password);
  if (!user) {
    return { ok: false, error: "Invalid email or password." };
  }

  const current = getAppState();
  const profile = registeredUserToProfile(user);
  const state: AppState = {
    ...current,
    isLoggedIn: true,
    profile,
  };
  saveAppState(state);
  return { ok: true, state };
}

export function resetAllAppData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("prepdeck-registered-users");
  clearPendingSignup();
}

export function logoutUser(): AppState {
  const state = getAppState();
  state.isLoggedIn = false;
  saveAppState(state);
  return state;
}
