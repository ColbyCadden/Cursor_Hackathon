import type { InventoryCategory } from "./types";
import { parseProductFromOff } from "./barcodeLookup";

export interface ProductSearchResult {
  barcode: string;
  name: string;
  amount: string;
  unit: string;
  category: InventoryCategory;
  imageUrl?: string;
}

/** Search Open Food Facts by product name (no barcode needed). */
export async function searchProducts(
  query: string
): Promise<ProductSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("search_terms", trimmed);
    url.searchParams.set("search_simple", "1");
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "12");
    url.searchParams.set(
      "fields",
      "code,product_name,brands,quantity,product_quantity,product_quantity_unit,categories_tags,image_front_small_url"
    );

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      products?: Array<{
        code?: string;
        product_name?: string;
        brands?: string;
        quantity?: string;
        product_quantity?: number | string;
        product_quantity_unit?: string;
        categories_tags?: string[];
        image_front_small_url?: string;
      }>;
    };

    const results: ProductSearchResult[] = [];

    for (const product of data.products ?? []) {
      const info = parseProductFromOff(product);
      if (!info || !product.code) continue;
      results.push({
        barcode: product.code.replace(/\D/g, "") || product.code,
        name: info.name,
        amount: info.amount,
        unit: info.unit,
        category: info.category,
        imageUrl: product.image_front_small_url,
      });
    }

    return results;
  } catch (error) {
    console.debug("[ProductSearch] search failed:", error);
    return [];
  }
}
