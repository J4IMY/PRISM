/**
 * ScraperAPI-based website scraper for PRISM vendor system listings.
 * Fetches pages via ScraperAPI and extracts system-level fields using cheerio.
 */

import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export type PricingPlan = {
  name: string;
  description?: string | null;
  pricing_model: string;
  currency: string;
  base_price: number | null;
  billing_cadence?: string | null;
  is_free: boolean;
  contact_sales: boolean;
  trial_available: boolean;
  trial_duration_days?: number | null;
  minimum_seats?: number | null;
  maximum_seats?: number | null;
  is_unlimited_seats: boolean;
  is_popular: boolean;
  features: string[];
};

export type ScrapedSystem = {
  url: string;
  name: string;
  description: string;
  starting_price: string;
  pricing_tier: string;
  plans: PricingPlan[];
};

export type ScraperOptions = {
  timeout?: number;
  render?: boolean;
  premium?: boolean;
};

const USER_AGENT = "Mozilla/5.0 (compatible; PRISM/1.0; +https://prism.dev)";

function getScraperApiKey(): string | undefined {
  const raw = process.env.SCRAPERAPI_KEY || process.env.SCRAPER_API_KEY;
  return raw?.trim() || undefined;
}

function absoluteUrl(base: string, href: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function cleanText(text: string | undefined | null): string {
  return text?.replace(/\s+/g, " ").trim() ?? "";
}

function pageText($: CheerioAPI): string {
  return cleanText($("body").text()).toLowerCase();
}

async function fetchHtmlViaScraperAPI(url: string, options: ScraperOptions = {}): Promise<string> {
  const apiKey = getScraperApiKey();
  if (!apiKey) {
    throw new Error(
      "ScraperAPI key not configured. Set SCRAPERAPI_KEY (or SCRAPER_API_KEY) in environment.",
    );
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    url,
    render: options.render !== false ? "true" : "false",
  });

  if (options.premium) {
    params.set("premium", "true");
  }

  const controller = new AbortController();
  const timeoutMs = (options.timeout ?? 60) * 1000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://api.scraperapi.com/?${params.toString()}`, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`ScraperAPI request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractJsonLd($: CheerioAPI): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (entry && typeof entry === "object") items.push(entry as Record<string, unknown>);
        }
      } else if (parsed && typeof parsed === "object") {
        items.push(parsed as Record<string, unknown>);
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });
  return items;
}

function extractName($: CheerioAPI, url: string, jsonLd: Record<string, unknown>[]): string {
  for (const item of jsonLd) {
    const type = String(item["@type"] ?? "").toLowerCase();
    if (type.includes("product") || type.includes("softwareapplication")) {
      const name = cleanText(String(item.name ?? ""));
      if (name) return name;
    }
  }

  const ogTitle = cleanText($('meta[property="og:title"]').attr("content"));
  if (ogTitle) return ogTitle.replace(/\s*[|-–—]\s*.+$/, "").trim();

  const title = cleanText($("title").text());
  if (title) return title.replace(/\s*[|-–—]\s*.+$/, "").trim();

  const h1 = cleanText($("h1").first().text());
  if (h1) return h1;

  try {
    return new URL(url).hostname;
  } catch {
    return "Unknown";
  }
}

function extractDescription($: CheerioAPI, jsonLd: Record<string, unknown>[]): string {
  for (const item of jsonLd) {
    const desc = cleanText(String(item.description ?? ""));
    if (desc) return desc.slice(0, 2000);
  }

  const metaDesc = cleanText($('meta[name="description"]').attr("content"));
  if (metaDesc) return metaDesc;

  const ogDesc = cleanText($('meta[property="og:description"]').attr("content"));
  if (ogDesc) return ogDesc;

  const p = cleanText($("main p, article p, .hero p, p").first().text());
  return p.slice(0, 500);
}

function extractPricingSectionText($: CheerioAPI): string {
  const section = $('[class*="pricing"], [class*="price"], #pricing, [id*="pricing"]').first();
  return cleanText(section.text());
}

function extractPricingModel(text: string): string {
  const lower = text.toLowerCase();
  if (/per user|per seat|per-user|per-seat/.test(lower)) return "per_user";
  if (/per organization|per org/.test(lower)) return "per_organization";
  if (/per device/.test(lower)) return "per_device";
  if (/per transaction/.test(lower)) return "per_transaction";
  if (/usage.?based|pay as you go|pay-as-you-go/.test(lower)) return "usage_based";
  if (/tiered usage/.test(lower)) return "tiered_usage";
  if (/annual subscription|billed annually|\/year|\/yr|yearly|per year/.test(lower))
    return "annual_subscription";
  if (/monthly subscription|\/month|\/mo|monthly|per month/.test(lower))
    return "monthly_subscription";
  if (/one.?time|perpetual license|lifetime/.test(lower)) return "one_time";
  if (/freemium|free plan|free tier/.test(lower)) return "freemium";
  if (/\bfree\b/.test(lower) && /plan|tier|forever/.test(lower)) return "free";
  if (/contact sales|custom pricing|request a quote|talk to sales/.test(lower))
    return "contact_sales";
  if (/subscription/.test(lower)) return "monthly_subscription";
  return "custom";
}

function extractBasePrice(pricingText: string, fullText: string): number | null {
  const sources = [pricingText, fullText];
  const patterns = [
    /$\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/,
    /USD\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i,
    /€\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/,
    /£\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/,
  ];

  for (const source of sources) {
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match?.[1]) {
        const value = parseFloat(match[1].replace(/,/g, ""));
        if (!Number.isNaN(value) && value > 0) return value;
      }
    }
  }
  return null;
}

function extractCurrency(pricingText: string, fullText: string): string {
  const text = `${pricingText} ${fullText}`.toLowerCase();
  if (text.includes("eur") || text.includes("€")) return "EUR";
  if (text.includes("gbp") || text.includes("£")) return "GBP";
  if (text.includes("kes")) return "KES";
  if (text.includes("zar")) return "ZAR";
  if (text.includes("ngn")) return "NGN";
  return "USD";
}

function extractBillingCadence(text: string): string {
  const lower = text.toLowerCase();
  if (/\/month|\/mo\b|monthly|per month|billed monthly/.test(lower)) return "monthly";
  if (/\/year|\/yr\b|yearly|annual|per year|billed annually/.test(lower)) return "annual";
  return "";
}

function extractPricingTier(text: string): string {
  const lower = text.toLowerCase();
  if (/\bfree\b/.test(lower) && /plan|tier/.test(lower)) return "free";
  if (/\bstarter\b/.test(lower)) return "starter";
  if (/\bprofessional\b|\bpro plan\b/.test(lower)) return "professional";
  if (/\bbusiness\b/.test(lower)) return "business";
  if (/\benterprise\b/.test(lower)) return "enterprise";
  return "";
}

function formatStartingPrice(price: number | null): string {
  if (price === null) return "";
  if (Number.isInteger(price)) return `$${price}`;
  return `$${price.toFixed(2)}`;
}

function hasFreeTrial(text: string): boolean {
  return /free trial|try free|trial period|demo available|\d+-day trial|free demo|start free/.test(
    text,
  );
}

function hasContactSales(text: string): boolean {
  return /contact sales|talk to sales|request a quote|custom pricing|enterprise pricing|contact us for pricing/.test(
    text,
  );
}

function extractTrialDurationDays(text: string): number | null {
  const match = text.match(/(\d+)[\s-]*day\s*trial/i);
  if (match?.[1]) {
    const days = parseInt(match[1], 10);
    if ([7, 14, 30, 60, 90].includes(days)) return days;
    return days <= 90 ? days : null;
  }
  return null;
}

function extractPricingPlans($: CheerioAPI, pricingText: string, fullText: string): PricingPlan[] {
  const price = extractBasePrice(pricingText, fullText);
  const pricingModel = extractPricingModel(`${pricingText} ${fullText}`);
  const billingCadence = extractBillingCadence(`${pricingText} ${fullText}`);
  const tier = extractPricingTier(`${pricingText} ${fullText}`) || "standard";
  const trialAvailable = hasFreeTrial(fullText);
  const contactSales = hasContactSales(fullText);
  const isFree =
    (/\bfree\b/.test(fullText) && /plan|tier|forever/.test(fullText) && price === null) ||
    pricingModel === "free";

  const planCards: PricingPlan[] = [];
  $('[class*="pricing"] [class*="plan"], [class*="price-card"], [class*="tier"]').each((_, el) => {
    const cardText = cleanText($(el).text());
    if (!cardText) return;

    const name =
      cleanText($(el).find("h2, h3, h4, [class*='name'], [class*='title']").first().text()) || tier;
    const cardPrice = extractBasePrice(cardText, cardText);
    const cardModel = extractPricingModel(cardText);

    planCards.push({
      name: name.slice(0, 80) || "Plan",
      description: cardText.slice(0, 240) || null,
      pricing_model: cardModel,
      currency: extractCurrency(cardText, fullText),
      base_price: cardPrice,
      billing_cadence: extractBillingCadence(cardText) || billingCadence || null,
      is_free: cardModel === "free" || (/\bfree\b/.test(cardText) && cardPrice === null),
      contact_sales: hasContactSales(cardText),
      trial_available: hasFreeTrial(cardText) || trialAvailable,
      trial_duration_days: extractTrialDurationDays(cardText),
      minimum_seats: null,
      maximum_seats: null,
      is_unlimited_seats: /unlimited seats|unlimited users/.test(cardText),
      is_popular: /popular|most popular|recommended|best value/.test(cardText),
      features: [],
    });
  });

  if (planCards.length > 0) return planCards.slice(0, 5);

  return [
    {
      name: tier.charAt(0).toUpperCase() + tier.slice(1),
      description: pricingText.slice(0, 240) || null,
      pricing_model: pricingModel,
      currency: extractCurrency(pricingText, fullText),
      base_price: price,
      billing_cadence: billingCadence || null,
      is_free: isFree,
      contact_sales: contactSales,
      trial_available: trialAvailable,
      trial_duration_days: extractTrialDurationDays(fullText),
      minimum_seats: null,
      maximum_seats: null,
      is_unlimited_seats: false,
      is_popular: false,
      features: [],
    },
  ];
}

function parseSystemFromHtml(html: string, url: string): ScrapedSystem {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const fullText = pageText($);
  const pricingText = extractPricingSectionText($);
  const price = extractBasePrice(pricingText, fullText);
  const pricingModel = extractPricingModel(`${pricingText} ${fullText}`);
  const billingCadence = extractBillingCadence(`${pricingText} ${fullText}`);
  const tier = extractPricingTier(`${pricingText} ${fullText}`) || "standard";
  const trialAvailable = hasFreeTrial(fullText);
  const contactSales = hasContactSales(fullText);

  return {
    url,
    name: extractName($, url, jsonLd),
    description: extractDescription($, jsonLd),
    starting_price: formatStartingPrice(price),
    pricing_tier: tier,
    plans: extractPricingPlans($, pricingText, fullText),
  };
}

export function isScraperAvailable(): boolean {
  return Boolean(getScraperApiKey());
}

export async function scrapeWebsite(
  url: string,
  options: ScraperOptions = {},
): Promise<ScrapedSystem> {
  const html = await fetchHtmlViaScraperAPI(url, options);
  return parseSystemFromHtml(html, url);
}

export async function batchScrape(
  urls: string[],
  options: ScraperOptions = {},
): Promise<{ results: ScrapedSystem[]; errors: { url: string; error: string }[] }> {
  const results: ScrapedSystem[] = [];
  const errors: { url: string; error: string }[] = [];
  const concurrencyLimit = 3;

  for (let i = 0; i < urls.length; i += concurrencyLimit) {
    const chunk = urls.slice(i, i + concurrencyLimit);
    await Promise.all(
      chunk.map(async (target) => {
        try {
          results.push(await scrapeWebsite(target, options));
        } catch (error) {
          errors.push({
            url: target,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );
  }

  return { results, errors };
}
