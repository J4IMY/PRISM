import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/admin/moderators/$id")({
  PATCH: async ({ request, params }) => {
    const admin = await requireRole(request, "admin");
    if (admin instanceof Response) return admin;

    const mod = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE id = $1 AND role = 'moderator'",
      [params.id],
    );
    if (!mod) {
      return Response.json({ error: "Moderator not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(body.name === null ? null : String(body.name));
    }
    if (body.role !== undefined) {
      const role = String(body.role);
      if (!["moderator", "user", "vendor", "admin"].includes(role)) {
        return Response.json({ error: "Invalid role" }, { status: 400 });
      }
      fields.push(`role = $${idx++}`);
      values.push(role);
    }
    if (body.suspended !== undefined) {
      fields.push(`suspended = $${idx++}`);
      values.push(body.suspended === true || body.suspended === "true");
    }
    if (body.password !== undefined) {
      const crypto = await import("crypto");
      const hash = crypto.createHash("sha256").update(String(body.password)).digest("hex");
      fields.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (fields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, email, name, role, suspended, created_at`,
      [...values, params.id],
    );

    return Response.json({ moderator: updated[0] });
  },

  DELETE: async ({ request, params }) => {
    const admin = await requireRole(request, "admin");
    if (admin instanceof Response) return admin;

    const mod = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE id = $1 AND role = 'moderator'",
      [params.id],
    );
    if (!mod) {
      return Response.json({ error: "Moderator not found" }, { status: 404 });
    }

    await query("DELETE FROM users WHERE id = $1", [params.id]);
    return Response.json({ success: true });
  },
});
