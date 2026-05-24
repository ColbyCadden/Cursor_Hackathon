import { createInitialAppState } from "./demoData";
import { deriveIngredientTags } from "./ingredientAliases";
import { DEFAULT_INVENTORY_PORTIONS, portionsFromLegacyPercent } from "./inventoryPortions";
import { enrichMeal, normalizeIngredientPreference } from "./meal/mealPersonalization";
import { syncPantryState } from "./pantrySync";
import { SEED_MEALS } from "./meal/seedMeals";
import { authenticateUser } from "./auth";
import { clearPendingSignup } from "./signupSession";
import { registeredUserToProfile } from "./signupProfile";
import { migrateShoppingCategory } from "./shoppingCategories";
import type {
  AppState,
  ChatMessage,
  InventoryItem,
  LegacyAppState,
  Meal,
  ShoppingListItem,
  UserProfile,
} from "./types";
const STORAGE_KEY = "prepdeck-app-state";

export { STORAGE_KEY };

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function migrateProfile(profile: Partial<UserProfile>): UserProfile {
  const base = createInitialAppState().profile;
  const merged = {
    ...base,
    ...profile,
    profileComplete: profile.profileComplete ?? false,
  };
  return {
    ...merged,
    ingredient_preference: normalizeIngredientPreference(
      merged.ingredient_preference,
    ),
    cooking_equipment: (merged.cooking_equipment ?? []).filter(
      (key) => key !== "grill",
    ),
  };
}

function migrateShoppingList(items: ShoppingListItem[]): ShoppingListItem[] {
  return items.map((item) => ({
    ...item,
    category: migrateShoppingCategory(item.category),
    bought: item.bought ?? false,
    addedToInventory: item.addedToInventory ?? false,
    required: item.required ?? true,
    source: item.source ?? "manual",
    reason: item.reason,
    sourceMealId: item.sourceMealId,
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
    const withSeed = existing ? { ...existing, ...seed } : seed;
    return enrichMeal(withSeed, seed);
  });

  return [...customs.map((meal) => enrichMeal(meal)), ...mergedSeeds];
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

function dedupeChatMessages(messages: ChatMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];

  for (const message of messages) {
    const messageTime = new Date(message.createdAt).getTime();
    const duplicate = result.some(
      (existing) =>
        existing.role === message.role &&
        existing.content === message.content &&
        Math.abs(messageTime - new Date(existing.createdAt).getTime()) < 5000
    );
    if (!duplicate) result.push(message);
  }

  return result;
}

function migrateInventoryItem(
  item: InventoryItem & { percentLeft?: number }
): InventoryItem {
  let portionsLeft = item.portionsLeft;
  if (typeof portionsLeft !== "number" && typeof item.percentLeft === "number") {
    portionsLeft = portionsFromLegacyPercent(item.percentLeft);
  }
  if (typeof portionsLeft !== "number" || Number.isNaN(portionsLeft)) {
    portionsLeft = DEFAULT_INVENTORY_PORTIONS;
  }

  return {
    ...item,
    portionsLeft: Math.max(0, Math.round(portionsLeft)),
    ingredientTags:
      item.ingredientTags ?? deriveIngredientTags(item.name, item.category),
  };
}

function migrateParsedState(parsed: LegacyAppState): AppState {
  const initial = createInitialAppState();

  const shoppingList = parsed.shoppingList?.length
    ? migrateShoppingList(parsed.shoppingList)
    : initial.shoppingList;

  return syncPantryState({
    isLoggedIn: parsed.isLoggedIn ?? false,
    profile: migrateProfile(parsed.profile ?? {}),
    inventory: (parsed.inventory ?? []).map((item) => migrateInventoryItem(item)),
    meals: migrateMeals(parsed),
    swipedMealIds: migrateSwipedIds(parsed),
    savedMealIds: migrateSavedIds(parsed),
    shoppingList,
    chatMessages: dedupeChatMessages(
      (parsed.chatMessages ?? []).map((msg) => ({
        ...msg,
        suggestedItems: msg.suggestedItems ?? undefined,
        mealPrepSteps: msg.mealPrepSteps ?? undefined,
        inventoryUpdates: msg.inventoryUpdates ?? undefined,
        suggestedItemsAdded: msg.suggestedItemsAdded ?? false,
        inventoryUpdatesApplied: msg.inventoryUpdatesApplied ?? false,
        actions: msg.actions ?? undefined,
        actionsApplied: msg.actionsApplied ?? [],
        recipes: msg.recipes ?? undefined,
        warnings: msg.warnings ?? undefined,
        needsUserChoice: msg.needsUserChoice ?? false,
      }))
    ),
    generatedMealPlan: parsed.generatedMealPlan ?? null,
  });
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
  window.dispatchEvent(new Event("prepdeck-state-changed"));
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
