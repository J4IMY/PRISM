import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";

export const APIRoute = createAPIFileRoute("/api/search")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";

    if (q.trim().length < 2) {
      return Response.json({ results: [] });
    }

    try {
      const results = await query(
        `SELECT s.id, s.name, s.slug, s.tagline, s.logo_url,
                s.rating, s.verified, s.pricing_tier,
                c.name AS category_name
         FROM systems s
         LEFT JOIN categories c ON s.category_id = c.id
         WHERE s.status = 'active'
           AND (s.name ILIKE $1 OR s.tagline ILIKE $1 OR s.description ILIKE $1)
         ORDER BY s.verified DESC, s.rating DESC
         LIMIT 20`,
        [`%${q}%`]
      );
      return Response.json({ results, query: q });
    } catch (err) {
      console.error("GET /api/search error:", err);
      return Response.json({ error: "Search failed" }, { status: 500 });
    }
  },
});
