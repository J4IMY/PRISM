import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/user/profile")({
  PATCH: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as { name?: string };
    const name = (body.name ?? "").trim();

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    await query(
      "UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [name, user.id],
    );

    return Response.json({ name });
  },
});
