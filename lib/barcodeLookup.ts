import type { InventoryCategory } from "./types";

export interface BarcodeProductInfo {
  name: string;
  amount: string;
  unit: string;
  category: InventoryCategory;
}

const OFF_FIELDS = [
  "product_name",
  "generic_name",
  "brands",
  "quantity",
  "product_quantity",
  "product_quantity_unit",
  "categories_tags",
].join(",");

function parseQuantityString(quantity: string): { amount: string; unit: string } {
  const trimmed = quantity.trim();
  const match = trimmed.match(/^([\d.,]+)\s*(.*)$/);
  if (!match) return { amount: "", unit: trimmed };
  return {
    amount: match[1].replace(/,/g, ""),
    unit: match[2].trim(),
  };
}

export function mapCategoryFromTags(tags: string[] | undefined): InventoryCategory {
  if (!tags?.length) return "Other";

  const joined = tags.join(" ").toLowerCase();
  if (/dairy|milk|cheese|yogurt/.test(joined)) return "Dairy";
  if (/meat|fish|protein|chicken|beef|pork|egg/.test(joined)) return "Protein";
  if (/fruit/.test(joined)) return "Fruit";
  if (/vegetable|produce/.test(joined)) return "Produce";
  if (/snack|chip|cookie|candy|energy|beverage|drink/.test(joined)) return "Snacks";
  if (/pasta|rice|bread|cereal|carb/.test(joined)) return "Carbs";
  if (/frozen/.test(joined)) return "Frozen";
  if (/sauce|spice|condiment/.test(joined)) return "Sauces/Spices";
  return "Other";
}

export function parseProductFromOff(product: {
  product_name?: string;
  generic_name?: string;
  brands?: string;
  quantity?: string;
  product_quantity?: number | string;
  product_quantity_unit?: string;
  categories_tags?: string[];
}): BarcodeProductInfo | null {
  const baseName = product.product_name?.trim() || product.generic_name?.trim();
  if (!baseName) return null;

  const brand = product.brands?.split(",")[0]?.trim();
  const name =
    brand && !baseName.toLowerCase().includes(brand.toLowerCase())
      ? `${brand} ${baseName}`
      : baseName;

  let amount = "";
  let unit = "";

  if (product.product_quantity !== undefined && product.product_quantity !== "") {
    amount = String(product.product_quantity);
    unit = product.product_quantity_unit?.trim() ?? "";
  } else if (product.quantity) {
    const parsed = parseQuantityString(product.quantity);
    amount = parsed.amount;
    unit = parsed.unit;
  }

  return {
    name,
    amount,
    unit,
    category: mapCategoryFromTags(product.categories_tags),
  };
}

function buildProductInfo(product: Parameters<typeof parseProductFromOff>[0]): BarcodeProductInfo | null {
  return parseProductFromOff(product);
}

/** Look up grocery product details from a barcode via Open Food Facts (client-side, no backend). */
export async function lookupBarcode(
  barcode: string
): Promise<BarcodeProductInfo | null> {
  const normalized = barcode.replace(/\D/g, "");
  if (!normalized) return null;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(normalized)}.json?fields=${OFF_FIELDS}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      status?: number;
      product?: Parameters<typeof buildProductInfo>[0];
    };

    if (data.status !== 1 || !data.product) return null;

    return buildProductInfo(data.product);
  } catch (error) {
    console.debug("[BarcodeLookup] Open Food Facts lookup failed:", error);
    return null;
  }
}

/** Look up many barcodes sequentially (avoids rate-limit issues). */
export async function lookupBarcodes(
  barcodes: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, BarcodeProductInfo | null>> {
  const results = new Map<string, BarcodeProductInfo | null>();
  const unique = [...new Set(barcodes.map((b) => b.replace(/\D/g, "") || b.trim()))].filter(
    Boolean
  );

  for (let i = 0; i < unique.length; i += 1) {
    const code = unique[i];
    results.set(code, await lookupBarcode(code));
    onProgress?.(i + 1, unique.length);
    if (i < unique.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return results;
}
