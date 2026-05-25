import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";

export const APIRoute = createAPIFileRoute("/api/systems")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("q");
    const verified = url.searchParams.get("verified");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    const conditions: string[] = ["s.status = 'active'"];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`c.slug = $${paramIdx++}`);
      params.push(category);
    }
    if (search) {
      conditions.push(`(s.name ILIKE $${paramIdx} OR s.tagline ILIKE $${paramIdx} OR s.description ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (verified === "true") {
      conditions.push(`s.verified = true`);
    }

    params.push(limit, offset);

    const sql = `
      SELECT
        s.id, s.name, s.slug, s.tagline, s.description,
        s.industry, s.target_size, s.deployment_type,
        s.pricing_tier, s.starting_price,
        s.has_api, s.has_mobile_app, s.has_ai_features, s.has_offline_mode,
        s.trial_available, s.enterprise_pricing,
        s.verified, s.rating, s.review_count,
        s.logo_url, s.website_url,
        s.security_certifications,
        c.name AS category_name, c.slug AS category_slug,
        v.company_name AS vendor_name, v.logo_url AS vendor_logo
      FROM systems s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN vendors v ON s.vendor_id = v.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY s.verified DESC, s.rating DESC, s.review_count DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    try {
      const systems = await query(sql, params);
      return Response.json({ systems, count: systems.length, offset, limit });
    } catch (err) {
      console.error("GET /api/systems error:", err);
      return Response.json({ error: "Failed to fetch systems" }, { status: 500 });
    }
  },
});
