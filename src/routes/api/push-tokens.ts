import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/push-tokens")({
  POST: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    try {
      const body = (await request.json()) as { token?: string; platform?: string };
      const { token, platform } = body;

      if (!token || !platform) {
        return Response.json({ error: "token and platform are required" }, { status: 400 });
      }

      if (!["ios", "android", "web"].includes(platform)) {
        return Response.json({ error: "Invalid platform" }, { status: 400 });
      }

      const [row] = await query(
        `INSERT INTO push_tokens (user_id, token, platform)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, token) DO UPDATE SET platform = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING id, token, platform, created_at`,
        [user.id, token, platform]
      );

      return Response.json({ push_token: row }, { status: 201 });
    } catch (err) {
      console.error("POST /api/push-tokens error:", err);
      return Response.json({ error: "Failed to register push token" }, { status: 500 });
    }
  },
});
