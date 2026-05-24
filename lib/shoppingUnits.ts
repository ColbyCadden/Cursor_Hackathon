/** Common grocery / recipe units for the shopping amount picker. */
export const SHOPPING_UNITS = [
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "count",
  "cloves",
  "breasts",
  "slices",
  "cups",
  "tbsp",
  "tsp",
  "pack",
  "bag",
  "bottle",
  "can",
  "carton",
  "box",
] as const;

export type ShoppingUnit = (typeof SHOPPING_UNITS)[number];

const UNIT_SET = new Set<string>(SHOPPING_UNITS);

/** Units that match how you'd buy it in store — use recipe unit directly. */
const STORE_FRIENDLY_UNITS = new Set([
  "cloves",
  "count",
  "breasts",
  "slices",
  "cups",
  "tbsp",
  "tsp",
  "pack",
  "bag",
  "bottle",
  "can",
  "carton",
  "box",
]);

export function isStoreFriendlyUnit(unit: string): boolean {
  return STORE_FRIENDLY_UNITS.has(unit.trim().toLowerCase());
}

/** Dropdown options — always includes the item's needed/buy unit even if custom. */
export function getUnitOptionsForItem(
  unitNeeded: string,
  buyUnit?: string
): string[] {
  const primary = (buyUnit || unitNeeded || "count").trim().toLowerCase();
  const needed = unitNeeded.trim().toLowerCase();
  const options = [primary, needed, ...SHOPPING_UNITS].filter(Boolean);
  return [...new Set(options)];
}

export function resolveDefaultUnit(
  unitNeeded: string,
  buyUnit?: string
): string {
  const needed = unitNeeded.trim().toLowerCase();
  const buy = buyUnit?.trim().toLowerCase();
  if (needed && (UNIT_SET.has(needed) || isStoreFriendlyUnit(needed))) {
    return needed;
  }
  if (buy && (UNIT_SET.has(buy) || isStoreFriendlyUnit(buy))) {
    return buy;
  }
  return needed || buy || "count";
}

export function unitInOptions(unit: string, options: string[]): boolean {
  return options.some((o) => o.toLowerCase() === unit.trim().toLowerCase());
}
