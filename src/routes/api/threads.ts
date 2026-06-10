import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/threads")({
  GET: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const url = new URL(request.url);
    const asVendor = url.searchParams.get("as") === "vendor";

    try {
      if (asVendor && (user.role === "vendor" || user.role === "admin")) {
        const member = await queryOne<{ vendor_id: string }>(
          "SELECT vendor_id FROM vendor_members WHERE user_id = $1",
          [user.id]
        );
        if (!member) return Response.json({ threads: [] });

        const threads = await query(
          `SELECT vt.*, s.name AS system_name, u.name AS user_name, u.email AS user_email
           FROM vendor_threads vt
           LEFT JOIN systems s ON s.id = vt.system_id
           JOIN users u ON u.id = vt.user_id
           WHERE vt.vendor_id = $1
           ORDER BY vt.updated_at DESC`,
          [member.vendor_id]
        );
        return Response.json({ threads });
      }

      const threads = await query(
        `SELECT vt.*, s.name AS system_name, v.company_name AS vendor_name
         FROM vendor_threads vt
         LEFT JOIN systems s ON s.id = vt.system_id
         JOIN vendors v ON v.id = vt.vendor_id
         WHERE vt.user_id = $1
         ORDER BY vt.updated_at DESC`,
        [user.id]
      );
      return Response.json({ threads });
    } catch (err) {
      console.error("GET /api/threads error:", err);
      return Response.json({ error: "Failed to fetch threads" }, { status: 500 });
    }
  },

  POST: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as {
      system_id?: string;
      vendor_id?: string;
      subject?: string;
      message?: string;
    };

    if (!body.subject || (!body.system_id && !body.vendor_id)) {
      return Response.json({ error: "subject and system_id or vendor_id required" }, { status: 400 });
    }

    let vendorId = body.vendor_id;
    let systemId = body.system_id ?? null;
    let messagingBlocked = false;

    if (body.system_id) {
      const system = await queryOne<{
        vendor_id: string | null;
        is_scraped: boolean;
        is_claimed: boolean;
        name: string;
      }>(
        "SELECT vendor_id, is_scraped, is_claimed, name FROM systems WHERE id = $1",
        [body.system_id]
      );
      if (!system) return Response.json({ error: "System not found" }, { status: 404 });
      vendorId = system.vendor_id ?? undefined;
      systemId = body.system_id;
      if (system.is_scraped && !system.is_claimed) {
        messagingBlocked = true;
      }
      if (!vendorId) {
        return Response.json(
          { error: "This system has no vendor and cannot be messaged until claimed" },
          { status: 403 }
        );
      }
    }

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM vendor_threads
       WHERE user_id = $1 AND vendor_id = $2 AND ($3::uuid IS NULL OR system_id = $3)`,
      [user.id, vendorId, systemId]
    );
    if (existing) {
      return Response.json({ thread_id: existing.id, existing: true });
    }

    const threads = await query(
      `INSERT INTO vendor_threads (vendor_id, system_id, user_id, subject, last_message, messaging_blocked, vendor_unread_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [vendorId, systemId, user.id, body.subject, body.message ?? null, messagingBlocked, body.message ? 1 : 0]
    );

    if (body.message && !messagingBlocked) {
      await query(
        `INSERT INTO messages (thread_id, sender_id, body) VALUES ($1, $2, $3)`,
        [threads[0].id, user.id, body.message]
      );
    }

    return Response.json({ thread: threads[0], messaging_blocked: messagingBlocked }, { status: 201 });
  },
});
