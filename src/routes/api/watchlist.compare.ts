import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";

type SystemRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  deployment_type: string | null;
  pricing_tier: string | null;
  starting_price: string | null;
  verified: boolean;
  trial_available: boolean;
  has_api: boolean;
  has_mobile_app: boolean;
  has_ai_features: boolean;
  security_certifications: string[];
  category_name: string | null;
  vendor_name: string | null;
};

type FeatureRow = {
  system_id: string;
  feature_name: string;
  feature_value: boolean;
  feature_detail: string | null;
  category: string | null;
};

type PackageRow = {
  system_id: string;
  id: string;
  name: string;
  description: string | null;
  pricing_model: string;
  currency: string;
  base_price: number | null;
  billing_cadence: string | null;
  trial_available: boolean;
  features: string[];
};

type ReviewRow = {
  system_id: string;
  rating: number;
  title: string | null;
  pros: string | null;
  cons: string | null;
  review_text: string | null;
  is_verified_customer: boolean;
  created_at: string;
};

export const APIRoute = createAPIFileRoute("/api/watchlist/compare")({
  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as { system_ids?: string[] };
      const systemIds = Array.isArray(body.system_ids) ? body.system_ids.filter(Boolean) : [];
      if (systemIds.length < 2 || systemIds.length > 3) {
        return Response.json({ error: "Select 2 to 3 systems to compare" }, { status: 400 });
      }

      const [systems, features, packages, reviews] = await Promise.all([
        query<SystemRow>(
          `SELECT
             s.id, s.name, s.slug, s.description, s.tagline,
             s.deployment_type, s.pricing_tier, s.starting_price,
             s.verified, s.trial_available,
             s.has_api, s.has_mobile_app, s.has_ai_features,
             s.security_certifications,
             c.name AS category_name,
             v.company_name AS vendor_name
           FROM systems s
           LEFT JOIN categories c ON s.category_id = c.id
           LEFT JOIN vendors v ON s.vendor_id = v.id
           WHERE s.id = ANY($1::uuid[])
           ORDER BY s.name`,
          [systemIds],
        ),
        query<FeatureRow>(
          `SELECT system_id, feature_name, feature_value, feature_detail, category
           FROM system_features
           WHERE system_id = ANY($1::uuid[])
           ORDER BY system_id, category, feature_name`,
          [systemIds],
        ),
        query<PackageRow>(
          `SELECT p.system_id, p.id, p.name, p.description, p.pricing_model, p.currency, p.base_price,
                  p.billing_cadence, p.trial_available,
                  COALESCE(json_agg(pf.feature_name) FILTER (WHERE pf.feature_name IS NOT NULL), '[]'::json) as features
           FROM pricing_packages p
           LEFT JOIN package_features pf ON pf.package_id = p.id
           WHERE p.system_id = ANY($1::uuid[])
           GROUP BY p.id
           ORDER BY p.display_order`,
          [systemIds],
        ),
        query<ReviewRow>(
          `SELECT system_id, rating, title, pros, cons, review_text,
                  is_verified_customer, created_at
           FROM reviews
           WHERE system_id = ANY($1::uuid[]) AND admin_status = 'approved'
           ORDER BY system_id, created_at DESC`,
          [systemIds],
        ),
      ]);

      const featuresBySystem = features.reduce<Record<string, FeatureRow[]>>((acc, f) => {
        if (!acc[f.system_id]) acc[f.system_id] = [];
        acc[f.system_id].push(f);
        return acc;
      }, {});

      const packagesBySystem = packages.reduce<Record<string, PackageRow[]>>((acc, p) => {
        if (!acc[p.system_id]) acc[p.system_id] = [];
        acc[p.system_id].push(p);
        return acc;
      }, {});

      const reviewsBySystem = reviews.reduce<Record<string, ReviewRow[]>>((acc, r) => {
        if (!acc[r.system_id]) acc[r.system_id] = [];
        acc[r.system_id].push(r);
        return acc;
      }, {});

      const results = systems.map((s) => ({
        ...s,
        features: featuresBySystem[s.id] || [],
        packages: packagesBySystem[s.id] || [],
        reviews: reviewsBySystem[s.id] || [],
      }));

      return Response.json({ systems: results });
    } catch (err) {
      console.error("POST /api/watchlist/compare error:", err);
      return Response.json({ error: "Failed to compare systems" }, { status: 500 });
    }
  },
});
