import * as cheerio from "cheerio";

export type ScrapedPage = {
  url: string;
  title: string;
  description: string;
  keywords: string;
  content: string;
  links: string[];
  images: string[];
  price?: string;
  pricing?: string[];
};

function absoluteUrl(base: string, href: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function cleanText(text: string | undefined): string {
  return text?.replace(/\s+/g, " ").trim() ?? "";
}

function truncate(text: string, max = 4000): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd();
}

function extractPrice(text: string): string | undefined {
  const match = text.match(
    /(?:\$|USD|EUR|GBP|KES|ZAR|NGN|AUD|CAD)\s?[\d,]+(?:\.\d{2})?(?:\s?\/\s?(?:mo|month|yr|year|user|seat|device))?/i,
  );
  if (match) return match[0];
  const match2 = text.match(
    /\d{1,4}(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|KES|ZAR|NGN|AUD|CAD)/i,
  );
  if (match2) return match2[0];
  return undefined;
}

export async function scrapeWebsite(url: string): Promise<ScrapedPage> {
  const target = new URL(url);

  const res = await fetch(target.toString(), {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PRISM/1.0; +https://prism.dev)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const html = await res.text();
  const base = url;

  const $ = cheerio.load(html);

  const title =
    cleanText($("title").text()) || cleanText($("h1").first().text()) || target.hostname;
  const description =
    cleanText($('meta[name="description"]').attr("content")) ||
    cleanText($('meta[property="og:description"]').attr("content")) ||
    "";
  const keywords = cleanText($('meta[name="keywords"]').attr("content")) || "";

  $("script, style, nav, header, footer, svg, noscript, iframe, aside").remove();

  const bodyText = cleanText($("body").text());
  const content = truncate(bodyText);

  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = absoluteUrl(base, $(el).attr("href") ?? "");
    if (href.startsWith("http") && new URL(href).hostname === target.hostname) links.push(href);
  });
  const uniqueLinks = [...new Set(links)].slice(0, 200);

  const images: string[] = [];
  $("img[src]").each((_, el) => {
    const src = absoluteUrl(base, $(el).attr("src") ?? "");
    if (src.startsWith("http")) images.push(src);
  });
  const uniqueImages = [...new Set(images)].slice(0, 50);

  const pricing: string[] = [];
  $(".price, .pricing, .plan, [class*=price], [class*=pricing]").each((_, el) => {
    const text = cleanText($(el).text());
    if (text && text.length < 200) pricing.push(text);
  });

  $("html").removeAttr("class");

  const price = extractPrice(content) || extractPrice($(".price").first().text());

  return {
    url,
    title,
    description: description || truncate(content, 300),
    keywords,
    content,
    links: uniqueLinks,
    images: uniqueImages,
    price,
    pricing: pricing.slice(0, 10),
  };
}
