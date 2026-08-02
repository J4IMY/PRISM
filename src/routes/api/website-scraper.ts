import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { scrapeWebsite, isScraperAvailable } from "@/lib/scraper-api";

export const APIRoute = createAPIFileRoute("/api/website-scraper")({
  POST: async ({ request }) => {
    const user = await requireRole(request, "admin", "moderator", "vendor");
    if (user instanceof Response) return user;

    try {
      const body = (await request.json()) as { url?: string };
      const url = typeof body.url === "string" ? body.url.trim() : "";

      if (!url) {
        return Response.json({ error: "url is required" }, { status: 400 });
      }

      let validated: URL;
      try {
        validated = new URL(url);
      } catch {
        return Response.json({ error: "Invalid URL" }, { status: 400 });
      }

      if (!["http:", "https:"].includes(validated.protocol)) {
        return Response.json({ error: "URL must start with http:// or https://" }, { status: 400 });
      }

      try {
        if (!isScraperAvailable()) {
          return Response.json(
            {
              error:
                "Scraper not available. Set SCRAPERAPI_KEY (or SCRAPER_API_KEY) in environment.",
            },
            { status: 503 },
          );
        }

        const scraped = await scrapeWebsite(validated.toString());

        const scraperPayload = {
          name: scraped.name,
          tagline: scraped.tagline || undefined,
          description: scraped.description || undefined,
          type: scraped.type || undefined,
          demo_url: scraped.demo_url || undefined,
          category: scraped.category || undefined,
          website_url: scraped.website_url || scraped.url,
          logo_url: scraped.logo_url || undefined,
          deployment_type: scraped.deployment_type || undefined,
          industry: scraped.industry || undefined,
          target_size: scraped.target_size || undefined,
          pricing_tier: scraped.pricing_tier || scraped.pricing_model || undefined,
          starting_price: scraped.starting_price || undefined,
          has_api: scraped.has_api,
          has_mobile_app: scraped.has_mobile_app,
          has_ai_features: scraped.has_ai_features,
          has_offline_mode: scraped.has_offline_mode,
          trial_available: scraped.trial_available,
          enterprise_pricing: scraped.enterprise_pricing,
          implementation_cost: scraped.implementation_cost || undefined,
          requirements: scraped.requirements || undefined,
          icon: scraped.icon || undefined,
          features: scraped.system_features.length > 0 ? scraped.system_features : scraped.features,
          plans: scraped.plans,
          media: scraped.media,
          links: scraped.links,
        };

        await query(
          `INSERT INTO scraper_items (
             name, source, source_url, confidence, age_days, status, payload
           ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
           RETURNING id, name, source, source_url, confidence, age_days, status, payload, system_id, created_at, updated_at`,
          [scraped.name, "website_scraper", scraped.url, 0.8, 0, JSON.stringify(scraperPayload)],
        );

        return Response.json({
          scraped: scraperPayload,
          data: scraped,
          message: "Scraped and queued for review",
        });
      } catch (err) {
        console.error("Website scrape error:", err);
        return Response.json(
          {
            error: "Failed to scrape website",
            details: err instanceof Error ? err.message : String(err),
          },
          { status: 500 },
        );
      }
    } catch (err) {
      console.error("POST /api/website-scraper error:", err);
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
  },
});
