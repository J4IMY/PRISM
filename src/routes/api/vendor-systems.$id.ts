import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne, transaction } from "@/lib/db";
import { requireRole } from "@/lib/auth";

type FeatureInput = {
  feature_name?: string;
  feature_value?: boolean;
  feature_detail?: string | null;
  category?: string | null;
};

type PricingPackageInput = {
  id?: string;
  name: string;
  description?: string | null;
  pricing_model: string;
  currency?: string;
  base_price?: number | null;
  billing_cadence?: string | null;
  is_free?: boolean;
  contact_sales?: boolean;
  trial_available?: boolean;
  trial_duration_days?: number | null;
  minimum_seats?: number | null;
  maximum_seats?: number | null;
  is_unlimited_seats?: boolean;
  is_popular?: boolean;
  features?: string[];
};

const VALID_TRIAL_DAYS = [7, 14, 30, 60, 90] as const;

function coerceTrialDays(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
  return VALID_TRIAL_DAYS.includes(n as (typeof VALID_TRIAL_DAYS)[number]) ? n : null;
}

export const APIRoute = createAPIFileRoute("/api/vendor-systems/$id")({
  GET: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const system = await queryOne(
      `SELECT s.* FROM systems s
       JOIN vendor_members vm ON vm.vendor_id = s.vendor_id
       WHERE s.id = $1 AND vm.user_id = $2`,
      [params.id, user.id],
    );
    if (!system) return Response.json({ error: "Not found" }, { status: 404 });

    const [media, features, packages] = await Promise.all([
      query("SELECT * FROM system_media WHERE system_id = $1 ORDER BY sort_order", [params.id]),
      query(
        `SELECT id, feature_name, feature_value, feature_detail, category
         FROM system_features WHERE system_id = $1 ORDER BY category, feature_name`,
        [params.id],
      ),
      query(
        `SELECT p.*, COALESCE(json_agg(pf.feature_name) FILTER (WHERE pf.feature_name IS NOT NULL), '[]'::json) as features
         FROM pricing_packages p
         LEFT JOIN package_features pf ON pf.package_id = p.id
         WHERE p.system_id = $1
         GROUP BY p.id
         ORDER BY p.display_order`,
        [params.id],
      ),
    ]);

    return Response.json({ system, media, features, packages });
  },

  PATCH: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await queryOne<{ can_manage_systems: boolean }>(
      `SELECT vm.can_manage_systems FROM vendor_members vm
       JOIN systems s ON s.vendor_id = vm.vendor_id
       WHERE s.id = $1 AND vm.user_id = $2`,
      [params.id, user.id],
    );
    if (!member?.can_manage_systems && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown> & {
      features?: FeatureInput[];
      pricing_packages?: PricingPackageInput[];
    };

    const featuresInput = body.features;
    const pricingPackages = body.pricing_packages as PricingPackageInput[] | undefined;

    const allowed = [
      "name",
      "tagline",
      "description",
      "type",
      "demo_url",
      "category_id",
      "industry",
      "target_size",
      "deployment_type",
      "pricing_tier",
      "starting_price",
      "has_api",
      "has_mobile_app",
      "has_ai_features",
      "has_offline_mode",
      "trial_available",
      "enterprise_pricing",
      "logo_url",
      "website_url",
      "status",
      "icon",
      "implementation_cost",
      "requirements",
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

    const hasChanges =
      fields.length > 0 || featuresInput !== undefined || pricingPackages !== undefined;
    if (!hasChanges) {
      return Response.json({ error: "No fields" }, { status: 400 });
    }

    let system: Record<string, unknown> | undefined;
    if (fields.length > 0) {
      fields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(params.id);
      const systems = await query(
        `UPDATE systems SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        values,
      );
      system = systems[0] as Record<string, unknown>;
    } else {
      system = (await queryOne("SELECT * FROM systems WHERE id = $1", [params.id])) ?? undefined;
    }

    if (featuresInput !== undefined) {
      await transaction(async (client) => {
        await client.query("DELETE FROM system_features WHERE system_id = $1", [params.id]);
        for (const feature of featuresInput) {
          const name = feature.feature_name?.trim();
          if (!name) continue;
          const featureExists = await client.query(
            "SELECT id FROM system_features WHERE system_id = $1 AND feature_name = $2",
            [params.id, name],
          );
          if (featureExists.rows.length === 0) {
            await client.query(
              `INSERT INTO system_features (system_id, feature_name, feature_value, feature_detail, category)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                params.id,
                name,
                feature.feature_value ?? true,
                feature.feature_detail ?? null,
                feature.category ?? null,
              ],
            );
          }
        }
      });
    }

    if (pricingPackages !== undefined) {
      await transaction(async (client) => {
        const existingIds = (
          await client.query("SELECT id FROM pricing_packages WHERE system_id = $1", [params.id])
        ).rows.map((r) => r.id);

        for (let i = 0; i < pricingPackages.length; i++) {
          const pkg = pricingPackages[i];
          if (!pkg.name || !pkg.pricing_model) continue;

          if (pkg.id) {
            await client.query(
              `UPDATE pricing_packages SET
                name = $1, description = $2, pricing_model = $3, currency = $4,
                base_price = $5, billing_cadence = $6, is_free = $7, contact_sales = $8,
                trial_available = $9, trial_duration_days = $10, minimum_seats = $11,
                maximum_seats = $12, is_unlimited_seats = $13, is_popular = $14,
                display_order = $15, updated_at = CURRENT_TIMESTAMP
               WHERE id = $16`,
              [
                pkg.name,
                pkg.description,
                pkg.pricing_model,
                pkg.currency ?? "USD",
                pkg.is_free || pkg.contact_sales ? null : pkg.base_price,
                pkg.billing_cadence,
                pkg.is_free ?? false,
                pkg.contact_sales ?? false,
                pkg.trial_available ?? false,
                coerceTrialDays(pkg.trial_available ? pkg.trial_duration_days : null),
                pkg.minimum_seats,
                pkg.maximum_seats,
                pkg.is_unlimited_seats ?? false,
                pkg.is_popular ?? false,
                i,
                pkg.id,
              ],
            );
          } else {
            const result = await client.query(
              `INSERT INTO pricing_packages (
                system_id, name, description, pricing_model, currency, base_price,
                billing_cadence, is_free, contact_sales, trial_available, trial_duration_days,
                minimum_seats, maximum_seats, is_unlimited_seats, is_popular, display_order
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
               RETURNING id`,
              [
                params.id,
                pkg.name,
                pkg.description,
                pkg.pricing_model,
                pkg.currency ?? "USD",
                pkg.is_free || pkg.contact_sales ? null : pkg.base_price,
                pkg.billing_cadence,
                pkg.is_free ?? false,
                pkg.contact_sales ?? false,
                pkg.trial_available ?? false,
                coerceTrialDays(pkg.trial_available ? pkg.trial_duration_days : null),
                pkg.minimum_seats,
                pkg.maximum_seats,
                pkg.is_unlimited_seats ?? false,
                pkg.is_popular ?? false,
                i,
              ],
            );
            pkg.id = result.rows[0].id;
          }

          await client.query("DELETE FROM package_features WHERE package_id = $1", [pkg.id]);
          if (pkg.features) {
            for (const featureName of pkg.features as string[]) {
              await client.query(
                "INSERT INTO package_features (package_id, feature_name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [pkg.id, featureName],
              );
            }
          }
        }

        const toDelete = existingIds.filter((id) => !pricingPackages.some((p) => p.id === id));
        for (const delId of toDelete) {
          await client.query("DELETE FROM pricing_packages WHERE id = $1", [delId]);
        }
      });
    }

    const updatedFeatures = await query(
      `SELECT id, feature_name, feature_value, feature_detail, category
       FROM system_features WHERE system_id = $1 ORDER BY category, feature_name`,
      [params.id],
    );

    const updatedPackages = await query(
      `SELECT p.*, COALESCE(json_agg(pf.feature_name) FILTER (WHERE pf.feature_name IS NOT NULL), '[]'::json) as features
       FROM pricing_packages p
       LEFT JOIN package_features pf ON pf.package_id = p.id
       WHERE p.system_id = $1
       GROUP BY p.id
       ORDER BY p.display_order`,
      [params.id],
    );

    return Response.json({ system, features: updatedFeatures, packages: updatedPackages });
  },

  DELETE: async ({ request, params }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const member = await queryOne<{ can_manage_systems: boolean }>(
      `SELECT vm.can_manage_systems FROM vendor_members vm
       JOIN systems s ON s.vendor_id = vm.vendor_id
       WHERE s.id = $1 AND vm.user_id = $2`,
      [params.id, user.id],
    );
    if (!member?.can_manage_systems && user.role !== "admin") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    await query(
      "UPDATE systems SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [params.id],
    );
    return Response.json({ success: true });
  },
});
