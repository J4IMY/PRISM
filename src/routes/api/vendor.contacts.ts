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

export const APIRoute = createAPIFileRoute("/api/vendor/contacts")({
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
    if (!body.role) return Response.json({ error: "role is required" }, { status: 400 });
    if (!body.email) return Response.json({ error: "email is required" }, { status: 400 });

    const contacts = await query(
      `INSERT INTO contacts (vendor_id, name, role, email, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, role, email, avatar_url`,
      [
        member.vendor_id,
        body.name,
        body.role,
        body.email,
        body.avatar_url ?? null,
      ],
    );

    return Response.json({ contact: contacts[0] }, { status: 201 });
  },
});
