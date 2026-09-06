/**
 * Purchasing Power Parity (PPP) Tiered Dynamic Pricing Engine for "We Hear".
 * Automatically maps international users into 3 pricing tiers:
 * - Tier 1 (US/UK/EU/CA/AU): Speaker $2.00, Listener $1.00 (Platform keeps ~$0.88)
 * - Tier 2 (Other Intl): Speaker $1.00, Listener $0.50 (Platform keeps ~$0.43)
 * - Tier 3 (India & South/SE Asia): Speaker ₹25, Listener ₹15 (Platform keeps ~₹9.41)
 */

export interface RegionalPricing {
  tier: "TIER_1" | "TIER_2" | "TIER_3";
  countryCode: string;
  currency: "USD" | "INR";
  currencySymbol: string;
  speakerPrice: number;
  listenerEarning: number; // Base earning (3-star)
  minListenerEarning: number; // Min earning (1-star)
  maxListenerEarning: number; // Max earning (5-star)
  amountInSmallestUnit: number; // Paise for INR, Cents for USD
  displaySpeakerPrice: string;
  displayListenerEarning: string;
  displayMinListenerEarning: string;
  displayMaxListenerEarning: string;
}

// High-income Tier 1 countries
const TIER_1_COUNTRIES = new Set([
  "US", "CA", "GB", "AU", "NZ", "DE", "FR", "IT", "ES", "NL",
  "SE", "NO", "DK", "FI", "CH", "AT", "IE", "BE", "SG", "AE",
  "JP", "KR", "LU", "IL", "PT", "GR"
]);

// South & Southeast Asia (Domestic & regional micro-pricing)
const TIER_3_COUNTRIES = new Set([
  "IN", "PK", "BD", "NP", "LK", "BT", "MM", "ID", "VN", "PH", "TH", "MY", "KH", "LA"
]);

/**
 * Returns the regional pricing based on country code (ISO 3166-1 alpha-2)
 */
export function getRegionalPricing(countryCode = "IN"): RegionalPricing {
  const code = (countryCode || "IN").trim().toUpperCase();

  if (TIER_1_COUNTRIES.has(code)) {
    return {
      tier: "TIER_1",
      countryCode: code,
      currency: "USD",
      currencySymbol: "$",
      speakerPrice: 0.99,
      listenerEarning: 0.50,
      minListenerEarning: 0.35,
      maxListenerEarning: 0.65,
      amountInSmallestUnit: 99, // 99 cents ($0.99)
      displaySpeakerPrice: "$0.99",
      displayListenerEarning: "$0.50",
      displayMinListenerEarning: "$0.35",
      displayMaxListenerEarning: "$0.65",
    };
  }

  if (TIER_3_COUNTRIES.has(code)) {
    return {
      tier: "TIER_3",
      countryCode: code,
      currency: "INR",
      currencySymbol: "₹",
      speakerPrice: 20.00,
      listenerEarning: 10.00,
      minListenerEarning: 8.00,
      maxListenerEarning: 14.00,
      amountInSmallestUnit: 2000, // 2000 paise (₹20.00)
      displaySpeakerPrice: "₹20",
      displayListenerEarning: "₹10",
      displayMinListenerEarning: "₹8",
      displayMaxListenerEarning: "₹14",
    };
  }

  // Tier 2: Rest of World / Middle-Income Nations
  return {
    tier: "TIER_2",
    countryCode: code,
    currency: "USD",
    currencySymbol: "$",
    speakerPrice: 0.50,
    listenerEarning: 0.25,
    minListenerEarning: 0.18,
    maxListenerEarning: 0.35,
    amountInSmallestUnit: 50, // 50 cents ($0.50)
    displaySpeakerPrice: "$0.50",
    displayListenerEarning: "$0.25",
    displayMinListenerEarning: "$0.18",
    displayMaxListenerEarning: "$0.35",
  };
}

/**
 * Calculates listener payout based on speaker's 1-5 star experience rating
 */
export function calculateListenerPayout(
  rating: number,
  minEarning: number,
  maxEarning: number,
  baseEarning: number
): number {
  const boundedRating = Math.max(1, Math.min(5, Math.round(rating)));

  switch (boundedRating) {
    case 1:
      return minEarning;
    case 2:
      return Math.round((minEarning + (baseEarning - minEarning) * 0.5 + Number.EPSILON) * 100) / 100;
    case 3:
      return baseEarning;
    case 4:
      return Math.round((baseEarning + (maxEarning - baseEarning) * 0.5 + Number.EPSILON) * 100) / 100;
    case 5:
      return maxEarning;
    default:
      return baseEarning;
  }
}

/**
 * Detects client country code from Cloudflare, reverse proxy, or dev fallback
 */
export function detectCountry(req: Request): string {
  // 1. Cloudflare Anycast header
  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry.length === 2 && cfCountry !== "XX") {
    return cfCountry.toUpperCase();
  }

  // 2. Reverse proxy / hosting headers
  const geoCountry = req.headers.get("x-vercel-ip-country") || req.headers.get("x-country-code");
  if (geoCountry && geoCountry.length === 2) {
    return geoCountry.toUpperCase();
  }

  // 3. Optional URL query parameter (?country=US) for development testing ONLY
  // In production, strictly reject client query overrides to prevent price tier spoofing
  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(req.url);
      const countryParam = url.searchParams.get("country");
      if (countryParam && countryParam.length === 2) {
        return countryParam.toUpperCase();
      }
    } catch {
      // Ignore URL parse errors on relative internal requests
    }
  }

  // Default fallback (configurable via DEFAULT_COUNTRY in .env)
  return process.env.DEFAULT_COUNTRY || "IN";
}
