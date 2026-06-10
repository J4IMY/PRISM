import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/notifications")({
  GET: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const notifications = await query(
      `SELECT id, title, body, type, link, read_at, created_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [user.id]
    );
    const unread = notifications.filter((n) => !(n as { read_at: string | null }).read_at).length;
    return Response.json({ notifications, unread });
  },

  PATCH: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as { ids?: string[]; mark_all?: boolean };
    if (body.mark_all) {
      await query(
        "UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read_at IS NULL",
        [user.id]
      );
    } else if (body.ids?.length) {
      await query(
        `UPDATE notifications SET read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [user.id, body.ids]
      );
    }
    return Response.json({ success: true });
  },
});
