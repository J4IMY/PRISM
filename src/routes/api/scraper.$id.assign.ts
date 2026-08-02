import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/scraper/$id/assign")({
  PATCH: async ({ request, params }) => {
    const user = await requireRole(request, "moderator", "admin");
    if (user instanceof Response) return user;

    try {
      const item = await queryOne<{ id: string; status: string; assigned_to: string | null }>(
        "SELECT id, status, assigned_to FROM scraper_items WHERE id = $1",
        [params.id],
      );
      if (!item) {
        return Response.json({ error: "Item not found" }, { status: 404 });
      }

      if (item.assigned_to && item.assigned_to !== user.id) {
        return Response.json({ error: "Item already assigned to another moderator" }, { status: 409 });
      }

      const updated = await query(
        `UPDATE scraper_items
         SET assigned_to = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, name, status, assigned_to`,
        [user.id, params.id],
      );

      return Response.json({ item: updated[0] });
    } catch (err) {
      console.error(`PATCH /api/scraper/${params.id}/assign error:`, err);
      return Response.json({ error: "Failed to assign item" }, { status: 500 });
    }
  },
});
