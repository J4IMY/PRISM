import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/moderator/queue")({
  GET: async ({ request }) => {
    const user = await requireRole(request, "moderator", "admin");
    if (user instanceof Response) return user;

    const items = await query<{
      id: string;
      name: string;
      source: string;
      confidence: number;
      age_days: number;
      status: string;
      created_at: string;
    }>(
      `SELECT id, name, source, confidence, age_days, status, created_at
       FROM scraper_items
       WHERE assigned_to = $1
       ORDER BY created_at DESC`,
      [user.id],
    );

    return Response.json({ items });
  },
});
