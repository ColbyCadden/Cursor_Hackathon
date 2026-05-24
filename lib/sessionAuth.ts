const SESSION_LOGIN_KEY = "prepdeck-session-active";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isSessionLoggedIn(): boolean {
  if (!isBrowser()) return false;
  return sessionStorage.getItem(SESSION_LOGIN_KEY) === "1";
}

export function markSessionLoggedIn(): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(SESSION_LOGIN_KEY, "1");
}

export function clearSessionLogin(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SESSION_LOGIN_KEY);
}
