import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";

async function assertCanManageSystem(systemId: string, userId: string, role: string) {
  const member = await queryOne<{ can_manage_systems: boolean }>(
    `SELECT vm.can_manage_systems FROM vendor_members vm
     JOIN systems s ON s.vendor_id = vm.vendor_id
     WHERE s.id = $1 AND vm.user_id = $2`,
    [systemId, userId],
  );
  if (!member?.can_manage_systems && role !== "admin") {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }
  return null;
}

export const APIRoute = createAPIFileRoute("/api/vendor-systems/$id/media/$mediaId")({
  DELETE: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const denied = await assertCanManageSystem(params.id, user.id, user.role);
    if (denied) return denied;

    const rows = await query(
      "DELETE FROM system_media WHERE id = $1 AND system_id = $2 RETURNING id",
      [params.mediaId, params.id],
    );
    if (rows.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  },
});
