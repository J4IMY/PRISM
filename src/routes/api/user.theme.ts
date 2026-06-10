import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/user/theme")({
  GET: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;
    return Response.json({ theme: user.theme });
  },

  PATCH: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as { theme?: string };
    if (!body.theme || !["light", "dark", "system"].includes(body.theme)) {
      return Response.json({ error: "Invalid theme" }, { status: 400 });
    }

    await query("UPDATE users SET theme = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      body.theme,
      user.id,
    ]);
    return Response.json({ theme: body.theme });
  },
});
