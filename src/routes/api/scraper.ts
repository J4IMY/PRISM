import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { requireRole, logAudit } from "@/lib/auth";

export type ScraperItem = {
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
};

function checkScraperKey(request: Request): boolean {
  const key = process.env.SCRAPER_API_KEY?.trim();
  if (!key) return true;
  return request.headers.get("x-scraper-key")?.trim() === key;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const APIRoute = createAPIFileRoute("/api/scraper")({
  GET: async ({ request }) => {
    const user = await requireRole(request, "moderator", "admin");
    if (user instanceof Response) return user;

    try {
      const items = await query<ScraperItem>(
        `SELECT id, name, source, source_url, confidence, age_days, status,
                payload, system_id, created_at, updated_at
         FROM scraper_items
         ORDER BY created_at DESC`,
      );
      return Response.json({ items });
    } catch (err) {
      console.error("GET /api/scraper error:", err);
      return Response.json({ error: "Failed to fetch scraper items" }, { status: 500 });
    }
  },

  POST: async ({ request }) => {
    if (!checkScraperKey(request)) {
      return Response.json({ error: "Invalid scraper API key" }, { status: 401 });
    }

    try {
      const body = (await request.json()) as {
        name: string;
        source: string;
        source_url?: string;
        confidence?: number;
        age_days?: number;
        payload?: Record<string, unknown>;
      };

      if (!body.name || !body.source) {
        return Response.json({ error: "name and source are required" }, { status: 400 });
      }

      const [item] = await query<ScraperItem>(
        `INSERT INTO scraper_items (name, source, source_url, confidence, age_days, status, payload)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         RETURNING id, name, source, source_url, confidence, age_days, status, payload, system_id, created_at, updated_at`,
        [
          body.name,
          body.source,
          body.source_url ?? null,
          body.confidence ?? 0,
          body.age_days ?? 0,
          JSON.stringify(body.payload ?? {}),
        ],
      );

      await logAudit(null, "scraper", "scraper.submit", item.id, body.name, body.payload);

      return Response.json({ item }, { status: 201 });
    } catch (err) {
      console.error("POST /api/scraper error:", err);
      return Response.json({ error: "Failed to create scraper item" }, { status: 500 });
    }
  },
});
