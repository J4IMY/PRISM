import { createAPIFileRoute } from "@tanstack/react-start/api";
import crypto from "crypto";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export const APIRoute = createAPIFileRoute("/api/vendors/team")({
  GET: async ({ request }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await queryOne<{ vendor_id: string }>(
      "SELECT vendor_id FROM vendor_members WHERE user_id = $1",
      [user.id]
    );
    if (!member) return Response.json({ members: [], invites: [] });

    const [members, invites] = await Promise.all([
      query(
        `SELECT vm.id, vm.role, vm.can_manage_systems, vm.can_manage_team, vm.can_respond_messages,
                u.id AS user_id, u.email, u.name
         FROM vendor_members vm
         JOIN users u ON u.id = vm.user_id
         WHERE vm.vendor_id = $1
         ORDER BY vm.role, u.name`,
        [member.vendor_id]
      ),
      query(
        `SELECT id, email, role, status, expires_at, created_at
         FROM vendor_invites WHERE vendor_id = $1 AND status = 'pending'
         ORDER BY created_at DESC`,
        [member.vendor_id]
      ),
    ]);

    return Response.json({ members, invites });
  },

  POST: async ({ request }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const body = (await request.json()) as { email?: string; role?: string };
    if (!body.email) return Response.json({ error: "email is required" }, { status: 400 });

    const member = await queryOne<{ vendor_id: string; can_manage_team: boolean }>(
      `SELECT vendor_id, can_manage_team FROM vendor_members
       WHERE user_id = $1 AND role IN ('owner', 'admin')`,
      [user.id]
    );
    if (!member?.can_manage_team && user.role !== "admin") {
      return Response.json({ error: "Not authorized to invite" }, { status: 403 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [invite] = await query(
      `INSERT INTO vendor_invites (vendor_id, email, invited_by, role, token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, status, expires_at`,
      [member.vendor_id, body.email.toLowerCase(), user.id, body.role ?? "member", token, expiresAt]
    );

    const baseUrl = process.env.APP_URL || "http://localhost:5000";
    try {
      await sendEmail({
        to: body.email,
        subject: "You've been invited to join a PRISM vendor team",
        text: `Accept invite: ${baseUrl}/vendor/team/accept?token=${token}`,
      });
    } catch (err) {
      console.error("Invite email failed:", err);
    }

    return Response.json({ invite }, { status: 201 });
  },
});
