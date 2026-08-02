#!/usr/bin/env node
/**
 * Test script for the ScraperAPI-based web scraper
 * Run: npx tsx test-scraper.ts <url>
 */

import { scrapeWebsite, isScraperAvailable } from "./src/lib/scraper-api";

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.log("Usage: npx tsx test-scraper.ts <url>");
    console.log("Example: npx tsx test-scraper.ts https://example.com");
    process.exit(1);
  }

  console.log("Testing ScraperAPI Web Scraper");
  console.log("=================================");

  console.log("\n1. Checking scraper availability...");
  if (!isScraperAvailable()) {
    console.error(
      "Scraper is not available. Set SCRAPERAPI_KEY (or SCRAPER_API_KEY) in your environment.",
    );
    process.exit(1);
  }
  console.log("Scraper is available");

  console.log(`\n2. Scraping URL: ${url}`);
  try {
    const startTime = Date.now();
    const result = await scrapeWebsite(url);
    const duration = Date.now() - startTime;

    console.log(`Scraped successfully in ${duration}ms`);
    console.log("\nScraped Data:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Scraping failed:", error);
    process.exit(1);
  }

  console.log("\nTest completed successfully!");
}

main().catch(console.error);
