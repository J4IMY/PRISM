import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/vendor/contacts/$id")({
  PATCH: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await queryOne<{ vendor_id: string; can_manage_team: boolean }>(
      `SELECT vm.vendor_id, vm.can_manage_team FROM vendor_members vm
       JOIN contacts c ON c.vendor_id = vm.vendor_id
       WHERE c.id = $1 AND vm.user_id = $2`,
      [params.id, user.id],
    );
    if (!member?.can_manage_team && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const allowed = ["name", "role", "email", "avatar_url"];
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(body[key]);
      }
    }
    if (fields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }
    values.push(params.id);

    const contacts = await query(
      `UPDATE contacts SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, name, role, email, avatar_url`,
      values,
    );
    if (!contacts[0]) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }
    return Response.json({ contact: contacts[0] });
  },

  DELETE: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await queryOne<{ can_manage_team: boolean }>(
      `SELECT vm.can_manage_team FROM vendor_members vm
       JOIN contacts c ON c.vendor_id = vm.vendor_id
       WHERE c.id = $1 AND vm.user_id = $2`,
      [params.id, user.id],
    );
    if (!member?.can_manage_team && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    await query("DELETE FROM contacts WHERE id = $1", [params.id]);
    return Response.json({ success: true });
  },
});
