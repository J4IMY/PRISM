import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/systems/$slug/reviews")({
  POST: async ({ request, params }) => {
    try {
      const { slug } = params;
      const body = (await request.json()) as {
        rating?: number;
        title?: string;
        pros?: string;
        cons?: string;
        review_text?: string;
      };

      if (!body.rating || body.rating < 1 || body.rating > 5) {
        return Response.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
      }

      const system = await queryOne<{ id: string }>(
        `SELECT id FROM systems WHERE slug = $1 AND status = 'active'`,
        [slug],
      );

      if (!system) {
        return Response.json({ error: "System not found" }, { status: 404 });
      }

      const user = await getAuthUser(request);

      await query(
        `INSERT INTO reviews (system_id, user_id, rating, title, pros, cons, review_text, is_verified_customer, admin_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved')`,
        [
          system.id,
          user?.id ?? null,
          body.rating,
          body.title?.trim() || null,
          body.pros?.trim() || null,
          body.cons?.trim() || null,
          body.review_text?.trim() || null,
          !!user,
        ],
      );

      return Response.json({ success: true });
    } catch (err) {
      console.error(`POST /api/systems/${params.slug}/reviews error:`, err);
      return Response.json(
        { error: err instanceof Error ? err.message : "Failed to submit review" },
        { status: 500 },
      );
    }
  },
});
