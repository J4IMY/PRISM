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

export const APIRoute = createAPIFileRoute("/api/vendor-systems/$id/media")({
  POST: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const denied = await assertCanManageSystem(params.id, user.id, user.role);
    if (denied) return denied;

    const body = (await request.json()) as {
      url?: string;
      media_type?: string;
      caption?: string | null;
    };
    if (!body.url?.trim()) {
      return Response.json({ error: "url is required" }, { status: 400 });
    }

    const mediaType = body.media_type ?? "screenshot";
    if (!["image", "video", "screenshot"].includes(mediaType)) {
      return Response.json({ error: "Invalid media_type" }, { status: 400 });
    }

    const maxOrder = await queryOne<{ max: number | null }>(
      "SELECT MAX(sort_order) AS max FROM system_media WHERE system_id = $1",
      [params.id],
    );
    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const rows = await query(
      `INSERT INTO system_media (system_id, media_type, url, caption, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [params.id, mediaType, body.url.trim(), body.caption ?? null, sortOrder],
    );

    return Response.json({ media: rows[0] }, { status: 201 });
  },
});
