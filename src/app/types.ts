// Shared type definitions for App.tsx, PlatformPanel.tsx, Router.tsx, StorePortal.tsx

export type StoreScreen =
  | "dashboard" | "pos" | "products" | "inventory"
  | "sales" | "customers" | "suppliers" | "purchases" | "expenses"
  | "reports" | "users" | "settings" | "appointments";

export type PlatformScreen =
  | "platform-dashboard" | "platform-stores" | "platform-users"
  | "platform-plans" | "platform-reports" | "platform-settings" | "platform-audit";

export type Screen = "login" | StoreScreen | PlatformScreen;

export interface AppUser {
  id: number; name: string; email: string; username: string;
  role: string; status: string; lastLogin: string;
  permissions: number | string[]; password: string;
  storeSlug?: string; // which store this user belongs to (empty = platform owner)
}

export interface Plan {
  id: string; name: string; nameAr: string; price: number;
  billingCycle: "monthly" | "yearly";
  maxUsers: number; maxProducts: number; maxBranches: number;
  features: string[]; color: string; popular?: boolean;
}

export interface TenantStore {
  id: string;
  storeId: string;
  // Identity
  name: string;
  slug: string;           // URL-friendly unique slug e.g. "al-madina-supermarket"
  customDomain: string;   // optional e.g. "www.almadinasupermarket.com"
  // Sector
  sector?: string;        // e.g. "supermarket" | "restaurant" | "pharmacy" | ...
  // Owner
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
  taxNumber: string;
  // Config
  currency: string;
  timezone: string;
  planId: string;
  // Status
  status: "active" | "inactive" | "suspended" | "trial";
  subscriptionStatus: "active" | "expired" | "trial" | "cancelled";
  // Limits
  maxUsers: number;
  maxProducts: number;
  maxBranches: number;
  // Live counters
  usersCount: number;
  productsCount: number;
  branchesCount: number;
  totalSales: number;
  // Dates
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
}

export interface AuditLog {
  id: string; storeId: string; userId: string; userName: string;
  action: string; entity: string; entityId: string; details: string;
  ip: string; createdAt: string;
}

// ─── Slug utilities (shared) ─────────────────────────────────────────────────

// Arabic → transliterated English map for common characters
const AR_MAP: Record<string, string> = {
  "ا":"a","أ":"a","إ":"a","آ":"a","ب":"b","ت":"t","ث":"th","ج":"j","ح":"h","خ":"kh",
  "د":"d","ذ":"dh","ر":"r","ز":"z","س":"s","ش":"sh","ص":"s","ض":"d","ط":"t","ظ":"z",
  "ع":"a","غ":"gh","ف":"f","ق":"q","ك":"k","ل":"l","م":"m","ن":"n","ه":"h","و":"w",
  "ي":"y","ى":"a","ة":"h","ء":"","ئ":"y","ؤ":"w","لا":"la",
};

function transliterateArabic(str: string): string {
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const twoChar = str.slice(i, i + 2);
    if (AR_MAP[twoChar]) { out += AR_MAP[twoChar]; i++; }
    else if (AR_MAP[str[i]]) { out += AR_MAP[str[i]]; }
    else out += str[i];
  }
  return out;
}

export function generateSlug(name: string, existingSlugs: string[] = []): string {
  const transliterated = transliterateArabic(name);
  const base = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")   // keep only ASCII letters, digits, spaces, hyphens
    .trim()
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "")           // trim leading/trailing hyphens
    || "store";

  if (!existingSlugs.includes(base)) return base;

  let n = 2;
  while (existingSlugs.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// Base URL — uses actual running origin so links are always live
// With HashRouter, routes are: <origin>/#/<slug>/login
const _origin = typeof window !== "undefined" ? window.location.origin : "https://your-app.com";
export const PLATFORM_DOMAIN = _origin;

export function storeLoginUrl(slug: string) { return `${_origin}/#/${slug}/login`; }
export function storeAppUrl(slug: string, page = "dashboard") { return `${_origin}/#/${slug}/${page}`; }
// Displayed slug-only path (for UI labels)
export function storeSlugPath(slug: string) { return `/#/${slug}/login`; }
