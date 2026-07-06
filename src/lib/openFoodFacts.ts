// Open Food Facts API v3.6 integration — supermarket sector only
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
// Rate limits: 15 req/min (product read) · 10 req/min (search)

const BASE_V3  = "https://world.openfoodfacts.org/api/v3.6";
const BASE_V2  = "https://world.openfoodfacts.org/api/v2";
const BASE_CGI = "https://world.openfoodfacts.org/cgi";

// Required by OFF — identify the app to avoid bot-detection bans
const USER_AGENT = "SOWWAN-POS/1.0 (broo.sowwan@gmail.com)";

const HEADERS = { "User-Agent": USER_AGENT };

export interface OFFProduct {
  barcode: string;
  nameAr: string;
  nameEn: string;
  brand: string;
  category: string;
  image: string;
  quantity: string;
  ingredients: string;
}

// ─── Category mapping OFF → Arabic supermarket categories ────────────────────
const CAT_MAP: Array<[string, string]> = [
  ["beverages",         "مشروبات"],
  ["drinks",            "مشروبات"],
  ["waters",            "مشروبات"],
  ["juices",            "مشروبات"],
  ["dairies",           "ألبان وأجبان"],
  ["dairy",             "ألبان وأجبان"],
  ["cheeses",           "ألبان وأجبان"],
  ["yogurts",           "ألبان وأجبان"],
  ["fruits",            "خضار وفواكه"],
  ["vegetables",        "خضار وفواكه"],
  ["meats",             "لحوم ودجاج"],
  ["poultry",           "لحوم ودجاج"],
  ["fish",              "لحوم ودجاج"],
  ["seafood",           "لحوم ودجاج"],
  ["breads",            "مخبوزات"],
  ["pastries",          "مخبوزات"],
  ["biscuits",          "حلويات وسناكس"],
  ["chocolates",        "حلويات وسناكس"],
  ["snacks",            "حلويات وسناكس"],
  ["sweet-snacks",      "حلويات وسناكس"],
  ["candies",           "حلويات وسناكس"],
  ["canned-foods",      "معلبات"],
  ["canned",            "معلبات"],
  ["cereals",           "مواد غذائية"],
  ["pastas",            "مواد غذائية"],
  ["rice",              "مواد غذائية"],
  ["cooking-oils",      "مواد غذائية"],
  ["sauces",            "مواد غذائية"],
  ["spices",            "مواد غذائية"],
  ["cleaning-products", "منظفات"],
  ["household",         "منظفات"],
];

function mapCategory(tags: string[] = []): string {
  for (const tag of tags) {
    const key = tag.replace(/^en:/, "").toLowerCase();
    const match = CAT_MAP.find(([k]) => key.includes(k));
    if (match) return match[1];
  }
  return "مواد غذائية";
}

// Validate an image URL — must be absolute HTTPS and non-empty
function validImg(url?: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) return "";
  return trimmed;
}

// Best display name: prefer Arabic, fall back to English, then generic
function bestName(raw: any): { nameAr: string; nameEn: string } {
  const ar = (raw.product_name_ar || "").trim();
  const en = (raw.product_name_en || raw.product_name || "").trim();
  return { nameAr: ar || en, nameEn: en || ar };
}

// ─── Parse raw OFF product object (works for v2 and v3) ──────────────────────
function parseProduct(raw: any, barcode: string): OFFProduct | null {
  const { nameAr, nameEn } = bestName(raw);
  // Skip products with no usable name
  if (!nameAr && !nameEn) return null;
  return {
    barcode:     (raw.code ?? barcode).trim(),
    nameAr,
    nameEn,
    brand:       (raw.brands || "").split(",")[0].trim(), // first brand only
    category:    mapCategory(raw.categories_tags),
    image:       validImg(raw.image_front_url) || validImg(raw.image_url) || "",
    quantity:    raw.quantity || "",
    ingredients: (raw.ingredients_text_ar || raw.ingredients_text || "").slice(0, 200),
  };
}

// ─── Fetch by barcode (v3.6) ──────────────────────────────────────────────────
// Rate limit: 15 req/min
export async function fetchByBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const fields = "code,product_name,product_name_ar,product_name_en,brands,categories_tags,image_front_url,image_url,quantity,ingredients_text_ar,ingredients_text";
    const res = await fetch(
      `${BASE_V3}/product/${encodeURIComponent(barcode)}.json?fields=${fields}`,
      { headers: HEADERS, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success" || !data.product) return null;
    return parseProduct(data.product, barcode);
  } catch {
    return null;
  }
}

// ─── Search by name (v2 structured search) ────────────────────────────────────
// Rate limit: 10 req/min — do NOT use for search-as-you-type
export async function searchByName(query: string, pageSize = 8): Promise<OFFProduct[]> {
  try {
    const fields = "code,product_name,product_name_ar,product_name_en,brands,categories_tags,image_front_url,image_url,quantity";
    // Use v2 structured search — prefer Jordanian/Arab products first
    const params = new URLSearchParams({
      search_terms: query,
      fields,
      page_size: String(pageSize),
      sort_by: "popularity",
      json: "1",
    });
    // Try Jordan-specific results first via CGI (full-text search — only option in v2/v3 for text)
    const res = await fetch(
      `${BASE_CGI}/search.pl?${params}`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const products: any[] = data.products ?? [];
    return products
      .map(p => parseProduct(p, p.code ?? ""))
      .filter((p): p is OFFProduct => p !== null);
  } catch {
    return [];
  }
}

// ─── Lookup multiple barcodes at once (v2 search by code list) ───────────────
// Useful for bulk product import
export async function fetchMultipleBarcodes(barcodes: string[]): Promise<OFFProduct[]> {
  try {
    const fields = "code,product_name,product_name_ar,product_name_en,brands,categories_tags,image_front_url,quantity";
    const params = new URLSearchParams({
      code: barcodes.join(","),
      fields,
      json: "1",
    });
    const res = await fetch(`${BASE_V2}/search?${params}`, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products ?? []).map((p: any) => parseProduct(p, p.code ?? "")).filter((p): p is OFFProduct => p !== null);
  } catch {
    return [];
  }
}
