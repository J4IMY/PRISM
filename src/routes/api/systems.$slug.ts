import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";

export const APIRoute = createAPIFileRoute("/api/systems/$slug")({
  GET: async ({ params }) => {
    const { slug } = params;

    try {
      const system = await queryOne(
        `SELECT
          s.*,
          c.name AS category_name, c.slug AS category_slug,
          v.company_name AS vendor_name, v.logo_url AS vendor_logo,
          v.website AS vendor_website, v.verification_status AS vendor_verified
        FROM systems s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN vendors v ON s.vendor_id = v.id
        WHERE s.slug = $1 AND s.status = 'active'`,
        [slug],
      );

      if (!system) {
        return Response.json({ error: "System not found" }, { status: 404 });
      }

      const [features, integrations, plans, reviews, media] = await Promise.all([
        query(
          `SELECT feature_name, feature_value, feature_detail, category
           FROM system_features WHERE system_id = $1 ORDER BY category, feature_name`,
          [(system as Record<string, unknown>).id],
        ),
        query(
          `SELECT integration_name, integration_type, api_available
           FROM system_integrations WHERE system_id = $1`,
          [(system as Record<string, unknown>).id],
        ),
        query(
          `SELECT p.*, COALESCE(json_agg(pf.feature_name) FILTER (WHERE pf.feature_name IS NOT NULL), '[]'::json) as features
           FROM pricing_packages p
           LEFT JOIN package_features pf ON pf.package_id = p.id
           WHERE p.system_id = $1
           GROUP BY p.id
           ORDER BY p.display_order`,
          [(system as Record<string, unknown>).id],
        ),
        query(
          `SELECT r.rating, r.title, r.pros, r.cons, r.review_text,
                  r.is_verified_customer, r.created_at
           FROM reviews r
           WHERE r.system_id = $1 AND r.admin_status = 'approved'
           ORDER BY r.created_at DESC LIMIT 10`,
          [(system as Record<string, unknown>).id],
        ),
        query(
          `SELECT id, media_type, url, caption, sort_order
           FROM system_media WHERE system_id = $1 ORDER BY sort_order`,
          [(system as Record<string, unknown>).id],
        ),
      ]);

      return Response.json({ system, features, integrations, plans, reviews, media });
    } catch (err) {
      console.error(`GET /api/systems/${slug} error:`, err);
      return Response.json({ error: "Failed to fetch system" }, { status: 500 });
    }
  },
});
