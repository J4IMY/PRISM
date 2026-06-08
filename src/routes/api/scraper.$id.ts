import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query, queryOne } from "@/lib/db";
import { requireRole, logAudit } from "@/lib/auth";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const APIRoute = createAPIFileRoute("/api/scraper/$id")({
  GET: async ({ request, params }) => {
    const user = await requireRole(request, "moderator", "admin");
    if (user instanceof Response) return user;

    try {
      const item = await queryOne(
        `SELECT id, name, source, source_url, confidence, age_days, status,
                payload, system_id, reviewed_by, reviewed_at, created_at, updated_at
         FROM scraper_items WHERE id = $1`,
        [params.id]
      );
      if (!item) return Response.json({ error: "Item not found" }, { status: 404 });
      return Response.json({ item });
    } catch (err) {
      console.error(`GET /api/scraper/${params.id} error:`, err);
      return Response.json({ error: "Failed to fetch scraper item" }, { status: 500 });
    }
  },

  PATCH: async ({ params, request }) => {
    const user = await requireRole(request, "moderator", "admin");
    if (user instanceof Response) return user;

    try {
      const body = (await request.json()) as { status?: string; publish?: boolean };
      const item = await queryOne<{
        id: string;
        name: string;
        status: string;
        payload: Record<string, unknown>;
        source_url: string | null;
      }>("SELECT id, name, status, payload, source_url FROM scraper_items WHERE id = $1", [params.id]);

      if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

      const newStatus = body.status ?? item.status;

      if (body.publish && newStatus === "approved") {
        const payload = item.payload ?? {};
        let slug = slugify(item.name);
        const conflict = await queryOne("SELECT id FROM systems WHERE slug = $1", [slug]);
        if (conflict) slug = `${slug}-${Date.now()}`;

        const categorySlug = (payload.category as string) ?? "crm";
        const category = await queryOne<{ id: string }>(
          "SELECT id FROM categories WHERE slug = $1",
          [categorySlug]
        );

        const systems = await query(
          `INSERT INTO systems (
             category_id, name, slug, tagline, description, website_url, logo_url,
             industry, target_size, deployment_type, pricing_tier, starting_price,
             status, is_scraped, is_claimed, scraper_item_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', true, false, $13)
           RETURNING id`,
          [
            category?.id ?? null,
            item.name,
            slug,
            (payload.tagline as string) ?? null,
            (payload.description as string) ?? null,
            (payload.website_url as string) ?? item.source_url,
            (payload.logo_url as string) ?? null,
            (payload.industry as string) ?? null,
            (payload.target_size as string) ?? null,
            (payload.deployment_type as string) ?? null,
            (payload.pricing_tier as string) ?? null,
            (payload.starting_price as string) ?? null,
            params.id,
          ]
        );

        const systemId = systems[0].id as string;

        if (Array.isArray(payload.features)) {
          for (const f of payload.features as { name: string; value?: boolean; detail?: string }[]) {
            await query(
              `INSERT INTO system_features (system_id, feature_name, feature_value, feature_detail)
               VALUES ($1, $2, $3, $4)`,
              [systemId, f.name, f.value ?? true, f.detail ?? null]
            );
          }
        }

        if (Array.isArray(payload.plans)) {
          for (const p of payload.plans as { name: string; price?: string; features?: string[] }[]) {
            await query(
              `INSERT INTO pricing_plans (system_id, name, price, features)
               VALUES ($1, $2, $3, $4)`,
              [systemId, p.name, p.price ?? null, p.features ?? []]
            );
          }
        }

        await query(
          `UPDATE scraper_items SET status = 'published', system_id = $1,
           reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [systemId, user.id, params.id]
        );

        await logAudit(user.id, user.email, "scraper.publish", systemId, item.name);

        const updated = await queryOne("SELECT * FROM scraper_items WHERE id = $1", [params.id]);
        return Response.json({ item: updated, system_id: systemId });
      }

      const items = await query(
        `UPDATE scraper_items
         SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, name, source, source_url, confidence, age_days, status, system_id, created_at, updated_at`,
        [newStatus, user.id, params.id]
      );

      await logAudit(user.id, user.email, `scraper.${newStatus}`, params.id, item.name);

      return Response.json({ item: items[0] });
    } catch (err) {
      console.error(`PATCH /api/scraper/${params.id} error:`, err);
      return Response.json({ error: "Failed to update scraper item" }, { status: 500 });
    }
  },
});
