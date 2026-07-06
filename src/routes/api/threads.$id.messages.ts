import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/threads/$id/messages")({
  POST: async ({ request, params }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as { body?: string };
    if (!body.body?.trim()) {
      return Response.json({ error: "Message body is required" }, { status: 400 });
    }

    const thread = await queryOne<{
      user_id: string;
      vendor_id: string;
      messaging_blocked: boolean;
    }>("SELECT user_id, vendor_id, messaging_blocked FROM vendor_threads WHERE id = $1", [
      params.id,
    ]);

    if (!thread) return Response.json({ error: "Thread not found" }, { status: 404 });

    const isUser = thread.user_id === user.id;
    const vendorMember = await queryOne(
      "SELECT id, can_respond_messages FROM vendor_members WHERE vendor_id = $1 AND user_id = $2",
      [thread.vendor_id, user.id],
    );
    const isVendor = !!vendorMember;

    if (!isUser && !isVendor && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (thread.messaging_blocked) {
      return Response.json(
        { error: "Messaging is blocked until this scraped system is claimed by a vendor" },
        { status: 403 },
      );
    }
    if (
      isVendor &&
      vendorMember &&
      !(vendorMember as { can_respond_messages: boolean }).can_respond_messages
    ) {
      return Response.json({ error: "You do not have permission to respond" }, { status: 403 });
    }

    const messages = await query(
      `INSERT INTO messages (thread_id, sender_id, body) VALUES ($1, $2, $3)
       RETURNING *`,
      [params.id, user.id, body.body.trim()],
    );

    const preview = body.body.trim().slice(0, 200);
    if (isUser) {
      await query(
        `UPDATE vendor_threads SET last_message = $1, vendor_unread_count = vendor_unread_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [preview, params.id],
      );
    } else {
      await query(
        `UPDATE vendor_threads SET last_message = $1, unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [preview, params.id],
      );
    }

    return Response.json({ message: messages[0] }, { status: 201 });
  },
});
