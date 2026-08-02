import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { TEAM_ROLES } from "@/lib/team-roles";

const ROLES = TEAM_ROLES;

export const APIRoute = createAPIFileRoute("/api/vendors/team/invites/$id")({
  PATCH: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const invite = await queryOne<{ vendor_id: string }>(
      "SELECT vendor_id FROM vendor_invites WHERE id = $1 AND status = 'pending'",
      [params.id],
    );
    if (!invite) {
      return Response.json({ error: "Invite not found" }, { status: 404 });
    }
    const member = await queryOne<{ vendor_id: string }>(
      "SELECT vendor_id FROM vendor_members WHERE user_id = $1 AND vendor_id = $2",
      [user.id, invite.vendor_id],
    );
    if (!member) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const role = body.role !== undefined ? String(body.role) : null;
    if (role && !ROLES.includes(role as (typeof ROLES)[number])) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    const updated = await query(
      `UPDATE vendor_invites SET role = COALESCE($2, role) WHERE id = $1
       RETURNING id, email, role, status, expires_at`,
      [params.id, role],
    );
    return Response.json({ invite: updated[0] });
  },

  DELETE: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const invite = await queryOne<{ vendor_id: string }>(
      "SELECT vendor_id FROM vendor_invites WHERE id = $1 AND status = 'pending'",
      [params.id],
    );
    if (!invite) {
      return Response.json({ error: "Invite not found" }, { status: 404 });
    }
    const member = await queryOne<{ vendor_id: string }>(
      "SELECT vendor_id FROM vendor_members WHERE user_id = $1 AND vendor_id = $2",
      [user.id, invite.vendor_id],
    );
    if (!member) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    await query("UPDATE vendor_invites SET status = 'revoked' WHERE id = $1", [params.id]);
    return Response.json({ success: true });
  },
});
