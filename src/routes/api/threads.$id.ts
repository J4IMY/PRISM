import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

async function canAccessThread(userId: string, role: string, threadId: string): Promise<boolean> {
  const thread = await queryOne<{ user_id: string; vendor_id: string; messaging_blocked: boolean }>(
    "SELECT user_id, vendor_id, messaging_blocked FROM vendor_threads WHERE id = $1",
    [threadId]
  );
  if (!thread) return false;
  if (thread.user_id === userId) return true;
  if (role === "admin") return true;
  const member = await queryOne(
    "SELECT id FROM vendor_members WHERE vendor_id = $1 AND user_id = $2",
    [thread.vendor_id, userId]
  );
  return !!member;
}

export const APIRoute = createAPIFileRoute("/api/threads/$id")({
  GET: async ({ request, params }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    if (!(await canAccessThread(user.id, user.role, params.id))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const thread = await queryOne("SELECT * FROM vendor_threads WHERE id = $1", [params.id]);
    const messages = await query(
      `SELECT m.*, u.name AS sender_name, u.email AS sender_email
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.thread_id = $1 ORDER BY m.created_at ASC`,
      [params.id]
    );

    return Response.json({ thread, messages });
  },

  PATCH: async ({ request, params }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as { assigned_member_id?: string };
    const member = await queryOne<{ vendor_id: string; can_manage_team: boolean }>(
      `SELECT vm.vendor_id, vm.can_manage_team FROM vendor_members vm
       JOIN vendor_threads vt ON vt.vendor_id = vm.vendor_id
       WHERE vt.id = $1 AND vm.user_id = $2`,
      [params.id, user.id]
    );
    if (!member?.can_manage_team && user.role !== "admin") {
      return Response.json({ error: "Not authorized to assign" }, { status: 403 });
    }

    await query(
      `UPDATE vendor_threads SET assigned_member_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [body.assigned_member_id ?? null, params.id]
    );
    if (body.assigned_member_id) {
      await query(
        `INSERT INTO thread_assignments (thread_id, assigned_member_id, assigned_by)
         VALUES ($1, $2, $3)`,
        [params.id, body.assigned_member_id, user.id]
      );
    }

    const thread = await queryOne("SELECT * FROM vendor_threads WHERE id = $1", [params.id]);
    return Response.json({ thread });
  },
});
