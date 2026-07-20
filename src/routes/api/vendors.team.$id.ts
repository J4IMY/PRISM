import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireRole, logAudit } from "@/lib/auth";
import { TEAM_ROLES, isOwnerRole } from "@/lib/team-roles";

const ROLES = TEAM_ROLES;

async function authorizeTeamManager(
  userId: string,
  memberId: string,
): Promise<{ ok: true; vendorId: string } | { ok: false; response: Response }> {
  const target = await queryOne<{ vendor_id: string }>(
    "SELECT vendor_id FROM vendor_members WHERE id = $1",
    [memberId],
  );
  if (!target) {
    return { ok: false, response: Response.json({ error: "Member not found" }, { status: 404 }) };
  }
  const manager = await queryOne<{ vendor_id: string; can_manage_team: boolean }>(
    "SELECT vendor_id, can_manage_team FROM vendor_members WHERE user_id = $1 AND vendor_id = $2",
    [userId, target.vendor_id],
  );
  if (!manager?.can_manage_team) {
    return { ok: false, response: Response.json({ error: "Not authorized" }, { status: 403 }) };
  }
  return { ok: true, vendorId: target.vendor_id };
}

export const APIRoute = createAPIFileRoute("/api/vendors/team/$id")({
  PATCH: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const auth = await authorizeTeamManager(user.id, params.id);
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as Record<string, unknown>;
    const current = await queryOne<{
      role: string;
      user_id: string;
      can_manage_systems: boolean;
      can_manage_team: boolean;
      can_respond_messages: boolean;
    }>(
      "SELECT role, user_id, can_manage_systems, can_manage_team, can_respond_messages FROM vendor_members WHERE id = $1",
      [params.id],
    );
    if (!current) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.role !== undefined) {
      const role = String(body.role);
      if (!ROLES.includes(role as (typeof ROLES)[number])) {
        return Response.json({ error: "Invalid role" }, { status: 400 });
      }
      fields.push(`role = $${idx++}`);
      values.push(role);
    }
    for (const perm of ["can_manage_systems", "can_manage_team", "can_respond_messages"] as const) {
      if (body[perm] !== undefined) {
        fields.push(`${perm} = $${idx++}`);
        values.push(body[perm] === true || body[perm] === "true");
      }
    }

    if (fields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const demotingSelf =
      body.role !== undefined &&
      !isOwnerRole(String(body.role)) &&
      current.user_id === user.id &&
      isOwnerRole(current.role);
    if (demotingSelf) {
      const owners = await query(
        "SELECT id FROM vendor_members WHERE vendor_id = $1 AND role = $2",
        [auth.vendorId, "dev"],
      );
      if (owners.length <= 1) {
        return Response.json({ error: "Cannot remove the last owner" }, { status: 400 });
      }
    }

    values.push(params.id);
    const updated = await query(
      `UPDATE vendor_members SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, role, can_manage_systems, can_manage_team, can_respond_messages`,
      values,
    );
    await logAudit(user.id, user.email, "team.member.update", params.id, current.role);
    return Response.json({ member: updated[0] });
  },

  DELETE: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const auth = await authorizeTeamManager(user.id, params.id);
    if (!auth.ok) return auth.response;

    const current = await queryOne<{ role: string; user_id: string }>(
      "SELECT role, user_id FROM vendor_members WHERE id = $1",
      [params.id],
    );
    if (!current) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }
    if (current.user_id === user.id) {
      return Response.json({ error: "You cannot remove yourself" }, { status: 400 });
    }
    if (isOwnerRole(current.role)) {
      const owners = await query(
        "SELECT id FROM vendor_members WHERE vendor_id = $1 AND role = $2",
        [auth.vendorId, "dev"],
      );
      if (owners.length <= 1) {
        return Response.json({ error: "Cannot remove the last owner" }, { status: 400 });
      }
    }

    await query("DELETE FROM vendor_members WHERE id = $1", [params.id]);
    await logAudit(user.id, user.email, "team.member.remove", params.id, current.role);
    return Response.json({ success: true });
  },
});
