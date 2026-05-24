import { SIGNUP_STEPS } from "./signupConstants";

const SIGNUP_SESSION_KEY = "prepdeck-signup-pending";

export interface PendingSignup {
  email?: string;
  password?: string;
  name?: string;
  cooking_equipment?: string[];
  eating_habits?: string;
  cooking_time_per_week?: string;
  cooking_skill_level?: string;
  ingredient_preference?: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getPendingSignup(): PendingSignup {
  if (!isBrowser()) return {};
  try {
    const raw = sessionStorage.getItem(SIGNUP_SESSION_KEY);
    return raw ? (JSON.parse(raw) as PendingSignup) : {};
  } catch {
    return {};
  }
}

export function savePendingSignup(data: Partial<PendingSignup>): void {
  if (!isBrowser()) return;
  const current = getPendingSignup();
  sessionStorage.setItem(
    SIGNUP_SESSION_KEY,
    JSON.stringify({ ...current, ...data })
  );
}

export function clearPendingSignup(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SIGNUP_SESSION_KEY);
}

function signupStepIndex(path: string): number {
  const idx = SIGNUP_STEPS.findIndex((s) => s.path === path);
  return idx >= 0 ? idx : 0;
}

export interface OnboardingStep {
  label: string;
  done: boolean;
  active: boolean;
  number: number;
}

export function onboardingProgress(currentPath: string): OnboardingStep[] {
  const current = signupStepIndex(currentPath);
  return SIGNUP_STEPS.map((step, i) => ({
    label: step.label,
    done: i < current,
    active: i === current,
    number: i + 1,
  }));
}

export function requirePendingAccount(): string | null {
  const pending = getPendingSignup();
  if (!pending.email || !pending.password || !pending.name) {
    return "/signup/account";
  }
  return null;
}

export function onboardingResumePath(pending: PendingSignup): string {
  if (!pending.email || !pending.password || !pending.name) {
    return "/signup/account";
  }
  if (!pending.cooking_equipment?.length) {
    return "/signup/equipment";
  }
  if (!pending.eating_habits) {
    return "/signup/diet";
  }
  if (!pending.cooking_time_per_week) {
    return "/signup/time";
  }
  if (!pending.cooking_skill_level) {
    return "/signup/skill";
  }
  if (!pending.ingredient_preference) {
    return "/signup/ingredients";
  }
  return "/mealdex";
}
