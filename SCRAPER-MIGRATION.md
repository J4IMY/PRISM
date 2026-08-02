# Web Scraper: ScraperAPI (TypeScript)

The PRISM website scraper fetches SaaS product pages through [ScraperAPI](https://www.scraperapi.com/) and extracts vendor **system-level** listing fields using cheerio heuristics (meta tags, JSON-LD, Open Graph, pricing sections, feature lists).

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  API Routes     │────▶│  scraper-api.ts  │────▶│  ScraperAPI     │
│  (website-      │     │  (cheerio parse) │     │  (page fetch)   │
│   scraper.ts)   │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Files

- `src/lib/scraper-api.ts` — ScraperAPI fetch + HTML extraction
- `src/routes/api/website-scraper.ts` — authenticated scrape endpoint
- `test-scraper.ts` — CLI test script

## System fields extracted

These map to vendor system creation (not company profile):

| Field | Source heuristics |
|-------|-------------------|
| `name` | JSON-LD Product/SoftwareApplication, og:title, `<title>`, h1 |
| `tagline` | Hero subtitle, h2, `.tagline` |
| `description` | JSON-LD, meta description, og:description, first paragraph |
| `type` | Page text (software/platform/service) |
| `demo_url` | Links labeled demo / try / get started |
| `category` / `industry` | Keyword detection in body text |
| `target_size` | SMB / mid-market / enterprise phrases |
| `deployment_type` | cloud / on-premise / hybrid keywords |
| `pricing_tier` | free / starter / pro / business / enterprise |
| `starting_price` | First price in pricing section |
| `has_api`, `has_mobile_app`, `has_ai_features`, `has_offline_mode` | Capability keywords |
| `trial_available`, `enterprise_pricing` | Trial / contact-sales phrases |
| `logo_url` | og:image, logo img |
| `website_url` | canonical link or source URL |
| `implementation_cost`, `requirements` | Pricing/requirements sections |
| `features` / `system_features` | Feature list items |
| `plans` | Pricing cards or synthesized default plan |
| `media` / `screenshots` | Product/hero/gallery images |
| `links` | Canonical + internal/external links |

**Excluded (vendor company profile):** company name, vendor website, social links, company size, founded date, location, technologies.

## Setup

1. Sign up at [scraperapi.com](https://www.scraperapi.com/) and copy your API key.
2. Add to `.env`:

```bash
SCRAPERAPI_KEY=your_scraperapi_key_here
```

`SCRAPER_API_KEY` is also accepted as a fallback. The separate optional `SCRAPER_API_KEY` header auth on `POST /api/scraper` (ingest) uses the same env name when set — prefer `SCRAPERAPI_KEY` for ScraperAPI.com to avoid ambiguity.

3. Test:

```bash
npx tsx test-scraper.ts https://example.com
```

## API

```bash
POST /api/website-scraper
Content-Type: application/json

{ "url": "https://example.com" }
```

Response includes `scraped` (scraper_items payload) and `data` (full extraction).

## ScraperAPI defaults

- `render=true` — JavaScript rendering for SPA marketing sites
- 60s timeout
- Optional `premium=true` via scraper options for difficult sites

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Scraper not available | Set `SCRAPERAPI_KEY` in `.env` |
| 403/401 from ScraperAPI | Verify key and account credits |
| Empty pricing/features | Site may need `premium` or custom selectors |
| Timeout | Increase timeout in `scrapeWebsite(url, { timeout: 90 })` |
