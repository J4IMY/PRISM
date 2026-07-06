import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const CATEGORY_WEIGHTS: Record<string, string[]> = {
  crm: ["sales", "crm", "customer", "leads", "pipeline"],
  erp: ["erp", "finance", "inventory", "operations", "enterprise"],
  helpdesk: ["support", "helpdesk", "ticketing", "customer service"],
  hr: ["hr", "payroll", "hiring", "people", "recruiting"],
  marketing: ["marketing", "email", "campaigns", "automation"],
  analytics: ["analytics", "bi", "reporting", "data", "dashboard"],
};

export const APIRoute = createAPIFileRoute("/api/recommendations")({
  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as {
        company_size?: string;
        industry?: string;
        needs?: string[];
        budget?: string;
        deployment?: string;
      };

      const user = await getAuthUser(request);
      const needs = (body.needs ?? []).map((n) => n.toLowerCase());
      const scores: Record<string, number> = {};

      for (const [slug, keywords] of Object.entries(CATEGORY_WEIGHTS)) {
        scores[slug] = keywords.filter((k) =>
          needs.some((n) => n.includes(k) || k.includes(n)),
        ).length;
        if (body.industry?.toLowerCase().includes(slug)) scores[slug] += 2;
      }

      const ranked = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .filter(([, s]) => s > 0)
        .slice(0, 3)
        .map(([slug]) => slug);

      const topCategories = ranked.length > 0 ? ranked : ["crm", "helpdesk", "analytics"];

      const conditions: string[] = ["s.status = 'active'"];
      const params: unknown[] = [topCategories];
      conditions.push(`c.slug = ANY($1::text[])`);

      if (body.deployment) {
        params.push(`%${body.deployment}%`);
        conditions.push(`s.deployment_type ILIKE $${params.length}`);
      }

      const systems = await query(
        `SELECT s.id, s.name, s.slug, s.tagline, s.rating, s.verified, s.starting_price,
                c.name AS category_name, c.slug AS category_slug
         FROM systems s
         JOIN categories c ON c.id = s.category_id
         WHERE ${conditions.join(" AND ")}
         ORDER BY s.verified DESC, s.rating DESC
         LIMIT 10`,
        params,
      );

      const recommendations = {
        categories: topCategories,
        systems,
        score_map: scores,
      };

      if (user) {
        await query(
          `INSERT INTO questionnaire_responses (user_id, answers, recommendations)
           VALUES ($1, $2, $3)`,
          [user.id, JSON.stringify(body), JSON.stringify(recommendations)],
        );
      }

      return Response.json(recommendations);
    } catch (err) {
      console.error("POST /api/recommendations error:", err);
      return Response.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }
  },
});
