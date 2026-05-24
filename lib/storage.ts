import { createInitialAppState } from "./demoData";
import { SWIPE_DECK_MEALS } from "./mealDeckData";
import { migrateShoppingCategory } from "./shoppingCategories";
import { authenticateUser } from "./auth";
import { clearPendingSignup } from "./signupSession";
import { registeredUserToProfile } from "./signupProfile";
import type { AppState, LegacyAppState, ShoppingListItem, UserProfile } from "./types";

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

function migrateParsedState(parsed: LegacyAppState): AppState {
  const initial = createInitialAppState();

  const mealLibrary =
    parsed.mealLibrary ??
    (parsed.meals?.filter((m) => m.saved !== false) ?? initial.mealLibrary);

  const swipeDeck =
    parsed.swipeDeck?.length ? parsed.swipeDeck : SWIPE_DECK_MEALS.map((m) => ({ ...m }));

  const shoppingList = parsed.shoppingList?.length
    ? migrateShoppingList(parsed.shoppingList)
    : initial.shoppingList;

  return {
    isLoggedIn: parsed.isLoggedIn ?? false,
    profile: migrateProfile(parsed.profile ?? {}),
    inventory: parsed.inventory?.length ? parsed.inventory : initial.inventory,
    mealLibrary,
    swipeDeck,
    swipeIndex: parsed.swipeIndex ?? 0,
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

export function logoutUser(): AppState {
  const state = getAppState();
  state.isLoggedIn = false;
  saveAppState(state);
  return state;
}

/** Wipes all saved accounts and app data — useful for testing signup from scratch. */
export function resetAllAppData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("prepdeck-registered-users");
  clearPendingSignup();
}
