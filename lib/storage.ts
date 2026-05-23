import { createInitialAppState } from "./demoData";
import { SWIPE_DECK_MEALS } from "./mealDeckData";
import type { AppState, LegacyAppState, UserProfile } from "./types";

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

function migrateParsedState(parsed: LegacyAppState): AppState {
  const initial = createInitialAppState();

  const mealLibrary =
    parsed.mealLibrary ??
    (parsed.meals?.filter((m) => m.saved !== false) ?? initial.mealLibrary);

  const swipeDeck =
    parsed.swipeDeck?.length ? parsed.swipeDeck : SWIPE_DECK_MEALS.map((m) => ({ ...m }));

  return {
    isLoggedIn: parsed.isLoggedIn ?? false,
    profile: migrateProfile(parsed.profile ?? {}),
    inventory: parsed.inventory?.length ? parsed.inventory : initial.inventory,
    mealLibrary,
    swipeDeck,
    swipeIndex: parsed.swipeIndex ?? 0,
    shoppingList: parsed.shoppingList?.length
      ? parsed.shoppingList
      : initial.shoppingList,
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
    const state = migrateParsedState(parsed);
    return state;
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
  const state = getAppState();
  state.isLoggedIn = true;
  saveAppState(state);
  return state;
}

export function logoutUser(): AppState {
  const state = getAppState();
  state.isLoggedIn = false;
  saveAppState(state);
  return state;
}
