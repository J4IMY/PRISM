import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";

export const APIRoute = createAPIFileRoute("/api/categories")({
  GET: async () => {
    try {
      const categories = await query(
        `SELECT c.id, c.name, c.slug, c.description, c.icon,
                COUNT(s.id) AS system_count
         FROM categories c
         LEFT JOIN systems s ON s.category_id = c.id AND s.status = 'active'
         GROUP BY c.id
         ORDER BY c.sort_order, c.name`
      );
      return Response.json({ categories });
    } catch (err) {
      console.error("GET /api/categories error:", err);
      return Response.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
  },
});
