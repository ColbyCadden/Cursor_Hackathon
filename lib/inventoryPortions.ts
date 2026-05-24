/** Default portions when adding a new package from scan or shopping list. */
export const DEFAULT_INVENTORY_PORTIONS = 4;

export function formatPortionsLeft(count: number): string {
  const n = Math.max(0, Math.round(count));
  if (n === 0) return "0 portions left";
  if (n === 1) return "1 portion left";
  return `${n} portions left`;
}

/** Convert legacy 0–100% values from older saved data. */
export function portionsFromLegacyPercent(percent: number): number {
  return Math.max(1, Math.round((percent / 100) * 8));
}
