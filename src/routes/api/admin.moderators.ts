import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export const APIRoute = createAPIFileRoute("/api/admin/moderators")({
  GET: async () => {
    const mods = await query<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      suspended: boolean;
      created_at: string;
    }>(
      `SELECT id, email, name, role, suspended, created_at
       FROM users
       WHERE role = 'moderator'
       ORDER BY created_at DESC`,
    );

    const throughput = await query<{ user_id: string; count: string }>(
      `SELECT reviewed_by AS user_id, COUNT(*) AS count
       FROM scraper_items
       WHERE reviewed_by = ANY($1::uuid[])
         AND status = 'published'
       GROUP BY reviewed_by`,
      [mods.map((m) => m.id)],
    );

    const throughputMap = new Map(throughput.map((t) => [t.user_id, parseInt(t.count)]));

    return Response.json({
      moderators: mods.map((m) => ({
        ...m,
        throughput: throughputMap.get(m.id) ?? 0,
      })),
    });
  },

  POST: async ({ request }) => {
    const admin = await requireRole(request, "admin");
    if (admin instanceof Response) return admin;

    const body = (await request.json()) as {
      email?: string;
      name?: string;
    };

    if (!body.email) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const email = body.email.toLowerCase();
    const existing = await queryOne<{ id: string; role: string; name: string | null }>(
      "SELECT id, role, name FROM users WHERE email = $1",
      [email],
    );

    const crypto = await import("crypto");
    const tempPassword = crypto.randomBytes(16).toString("hex");

    if (existing) {
      if (existing.role === "moderator") {
        return Response.json({ error: "User is already a moderator" }, { status: 409 });
      }

      const updated = await query(
        `UPDATE users SET role = 'moderator', name = COALESCE($2, name) WHERE id = $1
         RETURNING id, email, name, role, suspended, created_at`,
        [existing.id, body.name ?? null],
      );

      const appUrl = process.env.APP_URL || "http://localhost:5000";
      try {
        await sendEmail({
          to: email,
          subject: "You've been added as a PRISM moderator",
          text: `You have been added as a moderator on PRISM.\n\nSign in with:\nEmail: ${email}\nPassword: ${tempPassword}\n\nLogin: ${appUrl}/auth/login\n\nPlease change your password after first login.`,
        });
      } catch (err) {
        console.error("Moderator invite email failed:", err);
      }

      return Response.json({ moderator: updated[0] });
    }

    const mods = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'moderator')
       RETURNING id`,
      [email, tempPassword, body.name ?? null],
    );

    const appUrl = process.env.APP_URL || "http://localhost:5000";
    try {
      await sendEmail({
        to: email,
        subject: "You've been invited to be a PRISM moderator",
        text: `You have been invited to be a moderator on PRISM.\n\nSign in with:\nEmail: ${email}\nPassword: ${tempPassword}\n\nLogin: ${appUrl}/auth/login\n\nPlease change your password after first login.`,
      });
    } catch (err) {
      console.error("Moderator invite email failed:", err);
    }

    return Response.json({ moderator: mods[0] }, { status: 201 });
  },
});
