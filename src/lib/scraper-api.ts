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

export type MediaItem = {
  media_type: "image" | "video" | "screenshot";
  url: string;
  caption: string | null;
};

export type SystemFeature = {
  feature_name: string;
  feature_detail?: string | null;
  category?: string | null;
};

export type ScrapedSystem = {
  url: string;
  name: string;
  description: string;
  tagline: string;
  type: string;
  demo_url: string;
  category: string;
  industry: string;
  target_size: string;
  deployment_type: string;
  pricing_tier: string;
  pricing_model: string;
  base_price: number | null;
  starting_price: string;
  billing_cadence: string;
  has_api: boolean;
  has_mobile_app: boolean;
  has_ai_features: boolean;
  has_offline_mode: boolean;
  trial_available: boolean;
  enterprise_pricing: boolean;
  free_trial: boolean;
  contact_sales: boolean;
  logo_url: string;
  website_url: string;
  icon: string;
  implementation_cost: string;
  requirements: string;
  features: string[];
  system_features: SystemFeature[];
  plans: PricingPlan[];
  media: MediaItem[];
  links: string[];
  screenshots: string[];
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

function extractTagline($: CheerioAPI): string {
  const selectors = [".hero p", ".tagline", ".slogan", '[class*="subtitle"]', "h2"];
  for (const sel of selectors) {
    const text = cleanText($(sel).first().text());
    if (text && text.length > 5 && text.length <= 200) return text;
  }
  return "";
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

function extractDeploymentType(text: string): string {
  if (/on-premise|on-prem|self-hosted|self hosted|on premise/.test(text)) {
    if (/hybrid/.test(text)) return "hybrid";
    return "on-premise";
  }
  if (/hybrid/.test(text)) return "hybrid";
  if (/cloud|saas|hosted/.test(text)) return "cloud";
  return "cloud";
}

function extractIndustry(text: string): string {
  const industries = [
    { pattern: /\bcrm\b|customer relationship/, value: "crm" },
    { pattern: /\berp\b|enterprise resource/, value: "erp" },
    { pattern: /helpdesk|customer support|ticketing/, value: "helpdesk" },
    { pattern: /\bhr\b|human resources|payroll/, value: "hr" },
    { pattern: /marketing automation|email marketing/, value: "marketing" },
    { pattern: /analytics|business intelligence|\bbi\b/, value: "analytics" },
    { pattern: /cybersecurity|security|infosec/, value: "security" },
    { pattern: /project management/, value: "project management" },
    { pattern: /communication|collaboration|messaging/, value: "communication" },
    { pattern: /finance|accounting|invoicing/, value: "finance" },
    { pattern: /devops|ci\/cd|developer tools/, value: "devops" },
    { pattern: /e-?commerce|online store|shopping cart/, value: "ecommerce" },
  ];

  for (const { pattern, value } of industries) {
    if (pattern.test(text)) return value;
  }
  return "";
}

function extractTargetSize(text: string): string {
  if (/small business|small businesses|smb|startups?/.test(text)) return "small business";
  if (/mid-market|mid market|midsize|medium business/.test(text)) return "mid-market";
  if (/enterprise|large enterprise|large companies|fortune/.test(text)) return "enterprise";
  return "";
}

function extractCategory(text: string, industry: string): string {
  if (industry) return industry;
  const categories = ["crm", "erp", "helpdesk", "hr", "marketing", "analytics", "security"];
  for (const cat of categories) {
    if (text.includes(cat)) return cat;
  }
  return "";
}

function extractType(text: string): string {
  if (/platform/.test(text)) return "platform";
  if (/service/.test(text)) return "service";
  if (/software|application|app\b/.test(text)) return "software";
  return "";
}

function extractDemoUrl($: CheerioAPI, baseUrl: string): string {
  const demoPatterns = /demo|try it|get started|start free|free trial|request demo/i;
  let found = "";
  $("a[href]").each((_, el) => {
    if (found) return;
    const label = cleanText($(el).text());
    const href = $(el).attr("href") ?? "";
    if (!href || href.startsWith("#")) return;
    if (demoPatterns.test(label)) {
      found = absoluteUrl(baseUrl, href);
    }
  });
  return found;
}

function extractRequirements($: CheerioAPI): string {
  const section = $(
    '[class*="requirement"], [id*="requirement"], [class*="system-requirement"]',
  ).first();
  const text = cleanText(section.text());
  return text.slice(0, 500);
}

function extractImplementationCost(text: string): string {
  const match = text.match(
    /implementation(?:\s+cost|\s+fee|\s+price)?[^$€£]{0,30}([$€£]\s?[0-9,]+(?:\.[0-9]{2})?)/i,
  );
  return match?.[1]?.trim() ?? "";
}

function detectCapabilities(text: string): {
  has_api: boolean;
  has_mobile_app: boolean;
  has_ai_features: boolean;
  has_offline_mode: boolean;
} {
  return {
    has_api: /\bapi\b|rest api|graphql|webhook|developer api/.test(text),
    has_mobile_app: /mobile app|ios app|android app|mobile application/.test(text),
    has_ai_features:
      /\bai\b|artificial intelligence|machine learning|\bml\b|generative ai|copilot/.test(text),
    has_offline_mode: /offline mode|offline access|works offline|offline capability/.test(text),
  };
}

function extractFeatures($: CheerioAPI): string[] {
  const features: string[] = [];
  const selectors = [
    '[class*="feature"] li',
    ".features li",
    "#features li",
    '[class*="capability"] li',
    "ul li",
  ];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length > 2 && text.length < 200 && !features.includes(text)) {
        features.push(text);
      }
    });
    if (features.length >= 20) break;
  }

  return features.slice(0, 20);
}

function toSystemFeatures(features: string[]): SystemFeature[] {
  return features.map((name) => ({ feature_name: name }));
}

function extractLogoUrl($: CheerioAPI, baseUrl: string): string {
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) return absoluteUrl(baseUrl, ogImage);

  const logo = $('img[alt*="logo" i], img[class*="logo" i], .logo img, header img').first();
  const src = logo.attr("src") || logo.attr("data-src");
  if (src) return absoluteUrl(baseUrl, src);
  return "";
}

function extractWebsiteUrl($: CheerioAPI, baseUrl: string): string {
  const canonical = $('link[rel="canonical"]').attr("href");
  if (canonical) return absoluteUrl(baseUrl, canonical);
  return baseUrl;
}

function extractScreenshots($: CheerioAPI, baseUrl: string): string[] {
  const images: string[] = [];
  const selectors = [
    '[class*="screenshot"] img',
    '[class*="product"] img',
    '[class*="gallery"] img',
    '[class*="hero"] img',
    ".demo img",
    ".preview img",
    "main img",
  ];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (!src || src.startsWith("data:")) return;
      const abs = absoluteUrl(baseUrl, src);
      if (!images.includes(abs)) images.push(abs);
    });
    if (images.length >= 10) break;
  }

  return images.slice(0, 10);
}

function extractLinks($: CheerioAPI, baseUrl: string): string[] {
  const urls: string[] = [];
  const canonical = $('link[rel="canonical"]').attr("href");
  if (canonical) urls.push(absoluteUrl(baseUrl, canonical));

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
      return;
    const abs = absoluteUrl(baseUrl, href);
    if (abs.startsWith("http") && !urls.includes(abs)) urls.push(abs);
  });

  return urls.slice(0, 20);
}

function extractPricingPlans(
  $: CheerioAPI,
  features: string[],
  pricingText: string,
  fullText: string,
): PricingPlan[] {
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
      features: features.slice(0, 10),
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
      features: features.slice(0, 10),
    },
  ];
}

function parseSystemFromHtml(html: string, url: string): ScrapedSystem {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const fullText = pageText($);
  const pricingText = extractPricingSectionText($);
  const features = extractFeatures($);
  const price = extractBasePrice(pricingText, fullText);
  const pricingModel = extractPricingModel(`${pricingText} ${fullText}`);
  const industry = extractIndustry(fullText);
  const capabilities = detectCapabilities(fullText);
  const trialAvailable = hasFreeTrial(fullText);
  const contactSales = hasContactSales(fullText);
  const screenshots = extractScreenshots($, url);

  const media: MediaItem[] = screenshots.map((src) => ({
    media_type: "screenshot" as const,
    url: src,
    caption: null,
  }));

  const logoUrl = extractLogoUrl($, url);
  if (logoUrl && !screenshots.includes(logoUrl)) {
    media.unshift({ media_type: "image", url: logoUrl, caption: "Logo" });
  }

  return {
    url,
    name: extractName($, url, jsonLd),
    description: extractDescription($, jsonLd),
    tagline: extractTagline($),
    type: extractType(fullText),
    demo_url: extractDemoUrl($, url),
    category: extractCategory(fullText, industry),
    industry,
    target_size: extractTargetSize(fullText),
    deployment_type: extractDeploymentType(fullText),
    pricing_tier: extractPricingTier(`${pricingText} ${fullText}`),
    pricing_model: pricingModel,
    base_price: price,
    starting_price: formatStartingPrice(price),
    billing_cadence: extractBillingCadence(`${pricingText} ${fullText}`),
    has_api: capabilities.has_api,
    has_mobile_app: capabilities.has_mobile_app,
    has_ai_features: capabilities.has_ai_features,
    has_offline_mode: capabilities.has_offline_mode,
    trial_available: trialAvailable,
    enterprise_pricing: contactSales,
    free_trial: trialAvailable,
    contact_sales: contactSales,
    logo_url: logoUrl,
    website_url: extractWebsiteUrl($, url),
    icon: "",
    implementation_cost: extractImplementationCost(fullText),
    requirements: extractRequirements($),
    features,
    system_features: toSystemFeatures(features),
    plans: extractPricingPlans($, features, pricingText, fullText),
    media,
    links: extractLinks($, url),
    screenshots,
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
