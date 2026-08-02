import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne, transaction } from "@/lib/db";
import { requireRole, logAudit } from "@/lib/auth";

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "system";
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeFeatures(payload: Record<string, unknown>) {
  if (!Array.isArray(payload.features)) return [];

  return payload.features.flatMap((feature) => {
    if (typeof feature === "string" && feature.trim()) {
      return [{ name: feature.trim() }];
    }

    if (feature && typeof feature === "object") {
      const name = asString((feature as { name?: unknown }).name);
      if (!name) return [];
      return [
        {
          name,
          value:
            typeof (feature as { value?: unknown }).value === "boolean"
              ? (feature as { value?: boolean }).value
              : true,
          detail: asString((feature as { detail?: unknown }).detail),
          category: asString((feature as { category?: unknown }).category),
        },
      ];
    }

    return [];
  });
}

function normalizePlans(payload: Record<string, unknown>) {
  if (!Array.isArray(payload.plans)) return [];

  return payload.plans.flatMap((plan) => {
    if (typeof plan === "string" && plan.trim()) {
      return [{ name: plan.trim() }];
    }

    if (plan && typeof plan === "object") {
      const name = asString((plan as { name?: unknown }).name);
      if (!name) return [];
      const features = Array.isArray((plan as { features?: unknown }).features)
        ? (plan as { features: unknown[] }).features.flatMap((feature) => asString(feature) ?? [])
        : [];
      return [
        {
          name,
          price: asString((plan as { price?: unknown }).price),
          features,
        },
      ];
    }

    return [];
  });
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
        [params.id],
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
      const body = (await request.json()) as {
        status?: string;
        publish?: boolean;
        name?: string;
        description?: string;
        starting_price?: string;
        pricing_tier?: string;
        plans?: unknown[];
      };

      const item = await queryOne<{
        id: string;
        name: string;
        status: string;
        payload: Record<string, unknown>;
        source_url: string | null;
      }>("SELECT id, name, status, payload, source_url FROM scraper_items WHERE id = $1", [
        params.id,
      ]);

      if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

      const newStatus = body.status ?? item.status;

      if (body.publish && newStatus === "approved") {
        const payload = item.payload ?? {};
        const categorySlug = asString(payload.category) ?? "crm";
        const features = normalizeFeatures(payload);
        const plans = normalizePlans(payload);
        let slug = slugify(item.name);

        return await transaction(async (client) => {
          const conflict = await client.query<{ id: string }>(
            "SELECT id FROM systems WHERE slug = $1",
            [slug],
          );
          if (conflict.rows[0]) slug = `${slug}-${Date.now()}`;

          const category = await client.query<{ id: string }>(
            "SELECT id FROM categories WHERE slug = $1 OR name = $1 LIMIT 1",
            [categorySlug],
          );

          const systems = await client.query<{ id: string }>(
            `INSERT INTO systems (
               category_id, name, slug, tagline, description, website_url, logo_url,
               industry, target_size, deployment_type, pricing_tier, starting_price,
               status, is_scraped, is_claimed, scraper_item_id
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', true, false, $13)
             RETURNING id`,
            [
              category.rows[0]?.id ?? null,
              item.name,
              slug,
              asString(payload.tagline),
              asString(payload.description),
              asString(payload.website_url) ?? item.source_url,
              asString(payload.logo_url),
              asString(payload.industry),
              asString(payload.target_size),
              asString(payload.deployment_type),
              asString(payload.pricing_tier),
              asString(payload.starting_price),
              params.id,
            ],
          );

          const systemId = systems.rows[0].id;

          for (const feature of features) {
            await client.query(
              `INSERT INTO system_features (system_id, feature_name, feature_value, feature_detail, category)
               VALUES ($1, $2, $3, $4, $5)`,
              [systemId, feature.name, feature.value, feature.detail, feature.category],
            );
          }

          for (const plan of plans) {
            await client.query(
              `INSERT INTO pricing_plans (system_id, name, price, features)
               VALUES ($1, $2, $3, $4)`,
              [systemId, plan.name, plan.price, plan.features],
            );
          }

          await client.query(
            `UPDATE scraper_items SET status = 'published', system_id = $1,
             reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [systemId, user.id, params.id],
          );

          await logAudit(user.id, user.email, "scraper.publish", systemId, item.name);

          const updated = await client.query("SELECT * FROM scraper_items WHERE id = $1", [
            params.id,
          ]);

          return Response.json({ item: updated.rows[0], system_id: systemId });
        });
      }

      if (
        body.name !== undefined ||
        body.description !== undefined ||
        body.starting_price !== undefined ||
        body.pricing_tier !== undefined ||
        body.plans !== undefined
      ) {
        const payload = { ...(item.payload ?? {}) };
        if (body.name !== undefined) payload.name = body.name;
        if (body.description !== undefined) payload.description = body.description;
        if (body.starting_price !== undefined) payload.starting_price = body.starting_price;
        if (body.pricing_tier !== undefined) payload.pricing_tier = body.pricing_tier;
        if (body.plans !== undefined) payload.plans = body.plans;

        const updated = await query(
          `UPDATE scraper_items
           SET payload = $1::jsonb, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING id, name, source, source_url, confidence, age_days, status, payload, system_id, created_at, updated_at`,
          [JSON.stringify(payload), params.id],
        );

        await logAudit(user.id, user.email, "scraper.update", params.id, item.name);

        return Response.json({ item: updated[0] });
      }

      const items = await query(
        `UPDATE scraper_items
         SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, name, source, source_url, confidence, age_days, status, system_id, created_at, updated_at`,
        [newStatus, user.id, params.id],
      );

      await logAudit(user.id, user.email, `scraper.${newStatus}`, params.id, item.name);

      return Response.json({ item: items[0] });
    } catch (err) {
      console.error(`PATCH /api/scraper/${params.id} error:`, err);
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: `Failed to update scraper item: ${message}` }, { status: 500 });
    }
  },

  DELETE: async ({ params, request }) => {
    const user = await requireRole(request, "moderator", "admin");
    if (user instanceof Response) return user;

    try {
      const item = await queryOne<{ id: string; name: string }>(
        "SELECT id, name FROM scraper_items WHERE id = $1",
        [params.id],
      );
      if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

      await query("DELETE FROM scraper_items WHERE id = $1", [params.id]);
      await logAudit(user.id, user.email, "scraper.delete", params.id, item.name);

      return Response.json({ deleted: true });
    } catch (err) {
      console.error(`DELETE /api/scraper/${params.id} error:`, err);
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: `Failed to delete scraper item: ${message}` }, { status: 500 });
    }
  },
});
