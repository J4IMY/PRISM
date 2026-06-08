import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query, queryOne } from "@/lib/db";
import { requireRole } from "@/lib/auth";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function getVendorIdForUser(userId: string): Promise<string | null> {
  const row = await queryOne<{ vendor_id: string }>(
    "SELECT vendor_id FROM vendor_members WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return row?.vendor_id ?? null;
}

export const APIRoute = createAPIFileRoute("/api/vendor-systems")({
  GET: async ({ request }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const vendorId = await getVendorIdForUser(user.id);
    if (!vendorId) return Response.json({ systems: [] });

    const systems = await query(
      `SELECT s.*, c.name AS category_name
       FROM systems s
       LEFT JOIN categories c ON c.id = s.category_id
       WHERE s.vendor_id = $1
       ORDER BY s.updated_at DESC`,
      [vendorId]
    );
    return Response.json({ systems });
  },

  POST: async ({ request }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await queryOne<{ vendor_id: string; can_manage_systems: boolean }>(
      `SELECT vendor_id, can_manage_systems FROM vendor_members WHERE user_id = $1`,
      [user.id]
    );
    if (!member?.can_manage_systems && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (!body.name) return Response.json({ error: "name is required" }, { status: 400 });

    let slug = slugify(body.name as string);
    const conflict = await queryOne("SELECT id FROM systems WHERE slug = $1", [slug]);
    if (conflict) slug = `${slug}-${Date.now()}`;

    const systems = await query(
      `INSERT INTO systems (
         vendor_id, category_id, name, slug, tagline, description, type, demo_url,
         industry, target_size, deployment_type, pricing_tier, starting_price,
         has_api, has_mobile_app, has_ai_features, has_offline_mode,
         trial_available, enterprise_pricing, logo_url, website_url, status, is_claimed
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18, $19, $20, $21, $22, true
       ) RETURNING *`,
      [
        member.vendor_id,
        body.category_id ?? null,
        body.name,
        slug,
        body.tagline ?? null,
        body.description ?? null,
        body.type ?? null,
        body.demo_url ?? null,
        body.industry ?? null,
        body.target_size ?? null,
        body.deployment_type ?? null,
        body.pricing_tier ?? null,
        body.starting_price ?? null,
        body.has_api ?? false,
        body.has_mobile_app ?? false,
        body.has_ai_features ?? false,
        body.has_offline_mode ?? false,
        body.trial_available ?? false,
        body.enterprise_pricing ?? false,
        body.logo_url ?? null,
        body.website_url ?? null,
        body.status ?? "draft",
      ]
    );

    return Response.json({ system: systems[0] }, { status: 201 });
  },
});
