import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { scrapeWebsite, isScraperAvailable } from "@/lib/scraper-api";
import { query } from "@/lib/db";
import { logAudit } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/website-scraper")({
  POST: async ({ request }) => {
    if (!isScraperAvailable()) {
      return Response.json({ error: "Scraper API key is not configured" }, { status: 500 });
    }

    try {
      const body = (await request.json()) as { url?: string };
      const url = body.url?.trim();

      if (!url) {
        return Response.json({ error: "url is required" }, { status: 400 });
      }

      const result = await scrapeWebsite(url);

      const [item] = await query<{
        id: string;
        name: string;
        source: string;
        source_url: string | null;
        confidence: number;
        age_days: number;
        status: string;
        payload: Record<string, unknown>;
        system_id: string | null;
        created_at: string;
        updated_at: string;
      }>(
        `INSERT INTO scraper_items (name, source, source_url, confidence, age_days, status, payload)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         RETURNING id, name, source, source_url, confidence, age_days, status, payload, system_id, created_at, updated_at`,
        [result.name, new URL(url).hostname, url, 0, 0, JSON.stringify(result)],
      );

      await logAudit(null, "scraper", "scraper.submit", item.id, result.name, result);

      return Response.json({ item }, { status: 201 });
    } catch (err) {
      console.error("POST /api/website-scraper error:", err);
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: message }, { status: 500 });
    }
  },
});
