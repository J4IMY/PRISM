import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";

async function getVendorIdForUser(
  userId: string,
): Promise<{ vendor_id: string; can_manage_team: boolean } | null> {
  return (
    (await queryOne(
      `SELECT vendor_id, can_manage_team FROM vendor_members WHERE user_id = $1 LIMIT 1`,
      [userId],
    )) ?? null
  );
}

export const APIRoute = createAPIFileRoute("/api/vendor/technologies")({
  POST: async ({ request }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await getVendorIdForUser(user.id);
    if (!member?.can_manage_team && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }
    if (!member) {
      return Response.json({ error: "No vendor profile found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (!body.name) return Response.json({ error: "name is required" }, { status: 400 });

    const name = String(body.name).trim();
    if (!name) return Response.json({ error: "name is required" }, { status: 400 });
    const color = body.color ? String(body.color) : "#6b7280";

    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM technologies WHERE vendor_id = $1 AND LOWER(name) = LOWER($2)",
      [member.vendor_id, name],
    );
    if (existing) {
      const tech = await queryOne("SELECT id, name, color FROM technologies WHERE id = $1", [
        existing.id,
      ]);
      return Response.json({ technology: tech }, { status: 200 });
    }

    const inserted = await query(
      `INSERT INTO technologies (vendor_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING id, name, color`,
      [member.vendor_id, name, color],
    );

    return Response.json({ technology: inserted[0] }, { status: 201 });
  },

  DELETE: async ({ request }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await getVendorIdForUser(user.id);
    if (!member?.can_manage_team && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }
    if (!member) {
      return Response.json({ error: "No vendor profile found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    await query("DELETE FROM technologies WHERE id = $1 AND vendor_id = $2", [
      id,
      member.vendor_id,
    ]);

    return Response.json({ success: true });
  },
});
