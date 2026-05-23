import { createInitialAppState } from "./demoData";
import type { AppState } from "./types";

const STORAGE_KEY = "prepdeck-app-state";

function isBrowser(): boolean {
  return typeof window !== "undefined";
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
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...createInitialAppState(),
      ...parsed,
      profile: { ...createInitialAppState().profile, ...parsed.profile },
    };
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
