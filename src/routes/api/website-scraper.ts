import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { scrapeWebsite, type ScrapedPage } from "@/lib/web-scraper";

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
        const scraped = await scrapeWebsite(validated.toString());

        await query(
          `INSERT INTO scraper_items (
             name, source, source_url, confidence, age_days, status, payload
           ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
           RETURNING id, name, source, source_url, confidence, age_days, status, payload, system_id, created_at, updated_at`,
          [scraped.title, "website_scraper", scraped.url, 0.8, 0, JSON.stringify(scraped)],
        );

        return Response.json({ scraped, message: "Scraped and queued for review" });
      } catch (err) {
        console.error("Website scrape error:", err);
        return Response.json({ error: "Failed to scrape website" }, { status: 500 });
      }
    } catch (err) {
      console.error("POST /api/website-scraper error:", err);
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
  },
});
