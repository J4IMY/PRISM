import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/vendor-systems/$id")({
  GET: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const system = await queryOne(
      `SELECT s.* FROM systems s
       JOIN vendor_members vm ON vm.vendor_id = s.vendor_id
       WHERE s.id = $1 AND vm.user_id = $2`,
      [params.id, user.id]
    );
    if (!system) return Response.json({ error: "Not found" }, { status: 404 });

    const [media, plans] = await Promise.all([
      query("SELECT * FROM system_media WHERE system_id = $1 ORDER BY sort_order", [params.id]),
      query("SELECT * FROM pricing_plans WHERE system_id = $1", [params.id]),
    ]);

    return Response.json({ system, media, plans });
  },

  PATCH: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await queryOne<{ can_manage_systems: boolean }>(
      `SELECT vm.can_manage_systems FROM vendor_members vm
       JOIN systems s ON s.vendor_id = vm.vendor_id
       WHERE s.id = $1 AND vm.user_id = $2`,
      [params.id, user.id]
    );
    if (!member?.can_manage_systems && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const allowed = [
      "name", "tagline", "description", "type", "demo_url", "category_id",
      "industry", "target_size", "deployment_type", "pricing_tier", "starting_price",
      "has_api", "has_mobile_app", "has_ai_features", "has_offline_mode",
      "trial_available", "enterprise_pricing", "logo_url", "website_url", "status",
    ];
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(body[key]);
      }
    }
    if (fields.length === 0) return Response.json({ error: "No fields" }, { status: 400 });
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(params.id);

    const systems = await query(
      `UPDATE systems SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return Response.json({ system: systems[0] });
  },

  DELETE: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await queryOne<{ can_manage_systems: boolean }>(
      `SELECT vm.can_manage_systems FROM vendor_members vm
       JOIN systems s ON s.vendor_id = vm.vendor_id
       WHERE s.id = $1 AND vm.user_id = $2`,
      [params.id, user.id]
    );
    if (!member?.can_manage_systems && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    await query("UPDATE systems SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [params.id]);
    return Response.json({ success: true });
  },
});
