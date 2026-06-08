import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/watchlist")({
  GET: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    try {
      const items = await query(
        `SELECT
           w.id AS watchlist_id, w.created_at AS saved_at,
           s.id, s.name, s.slug, s.tagline, s.pricing_tier, s.starting_price,
           s.verified, s.rating, s.review_count, s.logo_url,
           c.name AS category_name,
           v.company_name AS vendor_name
         FROM watchlist w
         JOIN systems s ON s.id = w.system_id
         LEFT JOIN categories c ON s.category_id = c.id
         LEFT JOIN vendors v ON s.vendor_id = v.id
         WHERE w.user_id = $1 AND s.status = 'active'
         ORDER BY w.created_at DESC`,
        [user.id]
      );
      return Response.json({ items });
    } catch (err) {
      console.error("GET /api/watchlist error:", err);
      return Response.json({ error: "Failed to fetch watchlist" }, { status: 500 });
    }
  },

  POST: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    try {
      const body = (await request.json()) as { system_id?: string };
      if (!body.system_id) {
        return Response.json({ error: "system_id is required" }, { status: 400 });
      }

      const [item] = await query(
        `INSERT INTO watchlist (user_id, system_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, system_id) DO UPDATE SET created_at = watchlist.created_at
         RETURNING id, system_id, created_at`,
        [user.id, body.system_id]
      );
      return Response.json({ item }, { status: 201 });
    } catch (err) {
      console.error("POST /api/watchlist error:", err);
      return Response.json({ error: "Failed to add to watchlist" }, { status: 500 });
    }
  },
});
