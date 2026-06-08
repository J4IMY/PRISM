import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  details?: string;
  created_at: string;
};

export const APIRoute = createAPIFileRoute("/api/audit-log")({
  GET: async ({ request }) => {
    const user = await requireRole(request, "admin", "moderator");
    if (user instanceof Response) return user;

    try {
      const entries = await query<AuditLogEntry>(
        `SELECT id, actor, action, target, details, created_at
         FROM audit_log
         ORDER BY created_at DESC
         LIMIT 100`
      );
      return Response.json({ entries });
    } catch (err) {
      console.error("GET /api/audit-log error:", err);
      return Response.json({ error: "Failed to fetch audit log" }, { status: 500 });
    }
  },
});
