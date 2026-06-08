import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/watchlist/$systemId")({
  DELETE: async ({ request, params }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    try {
      const rows = await query(
        "DELETE FROM watchlist WHERE user_id = $1 AND system_id = $2 RETURNING id",
        [user.id, params.systemId]
      );
      if (rows.length === 0) {
        return Response.json({ error: "Not in watchlist" }, { status: 404 });
      }
      return Response.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/watchlist error:", err);
      return Response.json({ error: "Failed to remove from watchlist" }, { status: 500 });
    }
  },
});
