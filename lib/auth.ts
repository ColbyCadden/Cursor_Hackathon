export interface RegisteredUser {
  email: string;
  password: string;
  name: string;
  cooking_equipment: string[];
  eating_habits: string;
  cooking_time_per_week: string;
  cooking_skill_level: string;
  ingredient_preference: string;
  onboarding_completed: boolean;
}

const USERS_KEY = "prepdeck-registered-users";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getRegisteredUsers(): RegisteredUser[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as RegisteredUser[]) : [];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: RegisteredUser[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function emailExists(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return getRegisteredUsers().some((u) => u.email === normalized);
}

export function registerUser(user: RegisteredUser): void {
  const normalized = user.email.trim().toLowerCase();
  const users = getRegisteredUsers();
  if (users.some((u) => u.email === normalized)) {
    throw new Error("An account with this email already exists.");
  }
  users.push({ ...user, email: normalized });
  saveRegisteredUsers(users);
}

export function authenticateUser(
  email: string,
  password: string
): RegisteredUser | null {
  const normalized = email.trim().toLowerCase();
  const user = getRegisteredUsers().find((u) => u.email === normalized);
  if (!user || user.password !== password) return null;
  return user;
}

export function updateRegisteredUser(
  email: string,
  updates: Partial<Omit<RegisteredUser, "email">>
): RegisteredUser | null {
  const normalized = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.email === normalized);
  if (index < 0) return null;
  users[index] = { ...users[index], ...updates };
  saveRegisteredUsers(users);
  return users[index];
}

export function getRegisteredUser(email: string): RegisteredUser | null {
  const normalized = email.trim().toLowerCase();
  return getRegisteredUsers().find((u) => u.email === normalized) ?? null;
}
