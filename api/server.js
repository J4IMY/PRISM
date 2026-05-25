import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const app = express();
const PORT = process.env.API_PORT ?? 3001;

app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 10,
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── GET /api/categories ───────────────────────────────────────────────────────
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await query(
      `SELECT c.id, c.name, c.slug, c.description, c.icon,
              COUNT(s.id)::int AS system_count
       FROM categories c
       LEFT JOIN systems s ON s.category_id = c.id AND s.status = 'active'
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`
    );
    res.json({ categories });
  } catch (err) {
    console.error("GET /api/categories:", err.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ── GET /api/systems ──────────────────────────────────────────────────────────
app.get("/api/systems", async (req, res) => {
  const { category, q, verified, limit: rawLimit = "50", offset: rawOffset = "0" } = req.query;
  const limit = Math.min(parseInt(rawLimit), 100);
  const offset = parseInt(rawOffset);

  const conditions = ["s.status = 'active'"];
  const params = [];
  let idx = 1;

  if (category) {
    conditions.push(`c.slug = $${idx++}`);
    params.push(category);
  }
  if (q && q.length >= 2) {
    conditions.push(`(s.name ILIKE $${idx} OR s.tagline ILIKE $${idx} OR s.description ILIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }
  if (verified === "true") {
    conditions.push("s.verified = true");
  }

  params.push(limit, offset);

  try {
    const systems = await query(
      `SELECT
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
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );
    res.json({ systems, count: systems.length, offset, limit });
  } catch (err) {
    console.error("GET /api/systems:", err.message);
    res.status(500).json({ error: "Failed to fetch systems" });
  }
});

// ── GET /api/systems/:slug ────────────────────────────────────────────────────
app.get("/api/systems/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const [system] = await query(
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
      return res.status(404).json({ error: "System not found" });
    }

    const [features, integrations, plans, reviews] = await Promise.all([
      query(
        `SELECT feature_name, feature_value, feature_detail, category
         FROM system_features WHERE system_id = $1 ORDER BY category, feature_name`,
        [system.id]
      ),
      query(
        `SELECT integration_name, integration_type, api_available
         FROM system_integrations WHERE system_id = $1`,
        [system.id]
      ),
      query(
        `SELECT name, price, billing_cycle, is_popular, features, max_seats
         FROM pricing_plans WHERE system_id = $1 ORDER BY is_popular DESC`,
        [system.id]
      ),
      query(
        `SELECT r.rating, r.title, r.pros, r.cons, r.review_text,
                r.is_verified_customer, r.created_at
         FROM reviews r
         WHERE r.system_id = $1 AND r.admin_status = 'approved'
         ORDER BY r.created_at DESC LIMIT 10`,
        [system.id]
      ),
    ]);

    res.json({ system, features, integrations, plans, reviews });
  } catch (err) {
    console.error(`GET /api/systems/${slug}:`, err.message);
    res.status(500).json({ error: "Failed to fetch system" });
  }
});

// ── GET /api/search ───────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const { q = "" } = req.query;
  if (q.trim().length < 2) {
    return res.json({ results: [], query: q });
  }
  try {
    const results = await query(
      `SELECT s.id, s.name, s.slug, s.tagline, s.logo_url,
              s.rating, s.verified, s.pricing_tier,
              c.name AS category_name
       FROM systems s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.status = 'active'
         AND (s.name ILIKE $1 OR s.tagline ILIKE $1 OR s.description ILIKE $1)
       ORDER BY s.verified DESC, s.rating DESC
       LIMIT 20`,
      [`%${q}%`]
    );
    res.json({ results, query: q });
  } catch (err) {
    console.error("GET /api/search:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PRISM API server running on port ${PORT}`);
});
