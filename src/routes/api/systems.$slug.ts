import { createAPIFileRoute } from "@tanstack/react-start/api";
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
        [slug]
      );

      if (!system) {
        return Response.json({ error: "System not found" }, { status: 404 });
      }

      const [features, integrations, plans, reviews] = await Promise.all([
        query(
          `SELECT feature_name, feature_value, feature_detail, category
           FROM system_features WHERE system_id = $1 ORDER BY category, feature_name`,
          [(system as Record<string, unknown>).id]
        ),
        query(
          `SELECT integration_name, integration_type, api_available
           FROM system_integrations WHERE system_id = $1`,
          [(system as Record<string, unknown>).id]
        ),
        query(
          `SELECT name, price, billing_cycle, is_popular, features, max_seats
           FROM pricing_plans WHERE system_id = $1 ORDER BY is_popular DESC`,
          [(system as Record<string, unknown>).id]
        ),
        query(
          `SELECT r.rating, r.title, r.pros, r.cons, r.review_text,
                  r.is_verified_customer, r.created_at
           FROM reviews r
           WHERE r.system_id = $1 AND r.admin_status = 'approved'
           ORDER BY r.created_at DESC LIMIT 10`,
          [(system as Record<string, unknown>).id]
        ),
      ]);

      return Response.json({ system, features, integrations, plans, reviews });
    } catch (err) {
      console.error(`GET /api/systems/${slug} error:`, err);
      return Response.json({ error: "Failed to fetch system" }, { status: 500 });
    }
  },
});
