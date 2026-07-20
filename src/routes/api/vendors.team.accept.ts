import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { permissionsForRole, TEAM_ROLES } from "@/lib/team-roles";

export const APIRoute = createAPIFileRoute("/api/vendors/team/accept")({
  POST: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as { token?: string };
    if (!body.token) return Response.json({ error: "token is required" }, { status: 400 });

    const invite = await queryOne<{
      id: string;
      vendor_id: string;
      email: string;
      role: string;
      status: string;
      expires_at: string;
    }>(
      "SELECT id, vendor_id, email, role, status, expires_at FROM vendor_invites WHERE token = $1",
      [body.token],
    );

    if (!invite) return Response.json({ error: "Invalid invite" }, { status: 404 });
    if (invite.status !== "pending")
      return Response.json({ error: "Invite no longer valid" }, { status: 400 });
    if (new Date(invite.expires_at) < new Date()) {
      await query("UPDATE vendor_invites SET status = 'expired' WHERE id = $1", [invite.id]);
      return Response.json({ error: "Invite expired" }, { status: 400 });
    }
    if (invite.email !== user.email) {
      return Response.json({ error: "Invite email does not match your account" }, { status: 403 });
    }

    const role = TEAM_ROLES.includes(invite.role as (typeof TEAM_ROLES)[number])
      ? invite.role
      : "support";
    const perms = permissionsForRole(role);

    await query(
      `INSERT INTO vendor_members (vendor_id, user_id, role, can_manage_systems, can_manage_team, can_respond_messages)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (vendor_id, user_id) DO NOTHING`,
      [
        invite.vendor_id,
        user.id,
        role,
        perms.can_manage_systems,
        perms.can_manage_team,
        perms.can_respond_messages,
      ],
    );
    await query("UPDATE vendor_invites SET status = 'accepted' WHERE id = $1", [invite.id]);
    if (user.role === "user") {
      await query("UPDATE users SET role = 'vendor' WHERE id = $1", [user.id]);
    }

    return Response.json({ success: true });
  },
});
