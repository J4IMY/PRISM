import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadEnvFile } from "node:process";
import bcrypt from "bcryptjs";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");
if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const DEMO_USERS = [
  { email: "admin@prism.local", password: "Admin123!", name: "PRISM Admin", role: "admin" },
  { email: "mod@prism.local", password: "Mod12345!", name: "PRISM Moderator", role: "moderator" },
  { email: "vendor@acme.local", password: "Vendor123!", name: "Acme Vendor", role: "vendor" },
  { email: "user@demo.local", password: "User1234!", name: "Demo User", role: "user" },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    const extraCategories = [
      { name: "Security", slug: "security", description: "Cybersecurity and identity management", icon: "shield", sort_order: 7 },
      { name: "Project Management", slug: "project-management", description: "Project and task management", icon: "kanban", sort_order: 8 },
      { name: "Communication", slug: "communication", description: "Team chat and collaboration", icon: "message-circle", sort_order: 9 },
      { name: "Finance", slug: "finance", description: "Accounting and financial software", icon: "dollar-sign", sort_order: 10 },
      { name: "DevOps", slug: "devops", description: "CI/CD and infrastructure tools", icon: "server", sort_order: 11 },
      { name: "eCommerce", slug: "ecommerce", description: "Online store and retail platforms", icon: "shopping-cart", sort_order: 12 },
    ];

    for (const c of extraCategories) {
      await client.query(
        `INSERT INTO categories (name, slug, description, icon, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO NOTHING`,
        [c.name, c.slug, c.description, c.icon, c.sort_order]
      );
      console.log(`category  ${c.name}`);
    }

    let demoUserId: string | null = null;
    let vendorId: string | null = null;
    let acmeCrmId: string | null = null;

    for (const u of DEMO_USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const result = await client.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, name, role, email_verified, email_verified_at)
         VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [u.email, hash, u.name, u.role]
      );
      console.log(`user  ${u.email} (${u.role})`);
      const userId = result.rows[0].id;
      if (u.role === "user") demoUserId = userId;

      if (u.role === "vendor") {
      const vendor = await client.query<{ id: string }>(
        `INSERT INTO vendors (owner_user_id, company_name, slug, logo_url, website, verification_status, description, company_size, founded_date)
         VALUES ($1, 'Acme Software', 'acme-software', null, 'https://acme.local', 'verified',
                 'Enterprise software solutions for growing businesses.', '5,001–10,000', '1998')
         ON CONFLICT (slug) DO UPDATE SET owner_user_id = EXCLUDED.owner_user_id
         RETURNING id`,
        [userId]
      );
        vendorId = vendor.rows[0].id;
        await client.query(
          `INSERT INTO vendor_members (vendor_id, user_id, role, can_manage_systems, can_manage_team, can_respond_messages)
           VALUES ($1, $2, 'owner', true, true, true)
           ON CONFLICT (vendor_id, user_id) DO NOTHING`,
          [vendorId, userId]
        );

        const techSeeds = [
          { name: "Microsoft 365", color: "#3b82f6" },
          { name: ".NET", color: "#9333ea" },
          { name: "Java", color: "#d97706" },
          { name: "AWS", color: "#f97316" },
          { name: "React", color: "#22d3ee" },
        ];
        for (const t of techSeeds) {
          await client.query(
            `INSERT INTO technologies (vendor_id, name, color)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [vendorId, t.name, t.color]
          );
          console.log(`technology  ${t.name}`);
        }

        const contactSeeds = [
          { name: "Jane Smith", role: "IT Director", email: "jane.smith@company.com" },
          { name: "Mark Johnson", role: "Software Asset Manager", email: "mark.johnson@company.com" },
          { name: "Lisa Chen", role: "Procurement Manager", email: "lisa.chen@company.com" },
        ];
        for (const c of contactSeeds) {
          await client.query(
            `INSERT INTO contacts (vendor_id, name, role, email)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [vendorId, c.name, c.role, c.email]
          );
          console.log(`contact  ${c.name}`);
        }

        const crm = await client.query<{ id: string }>(
          "SELECT id FROM categories WHERE slug = 'crm' LIMIT 1"
        );
        const categoryId = crm.rows[0]?.id;

        const systemResult = await client.query<{ id: string }>(
          `INSERT INTO systems (
             vendor_id, category_id, name, slug, tagline, description,
             industry, target_size, deployment_type, pricing_tier, starting_price,
             has_api, has_mobile_app, has_ai_features, trial_available, enterprise_pricing,
             verified, rating, review_count, status, is_claimed
           ) VALUES (
             $1, $2, 'Acme CRM Pro', 'acme-crm-pro',
             'The CRM built for modern sales teams',
             'Acme CRM Pro helps sales teams close deals faster with AI-powered insights, pipeline automation, and deep integrations.',
             'SaaS', 'SMB to Enterprise', 'Cloud', 'per-seat', '$29/user/mo',
             true, true, true, true, true,
             true, 4.5, 128, 'active', true
           )
           ON CONFLICT (slug) DO UPDATE SET vendor_id = EXCLUDED.vendor_id
           RETURNING id`,
          [vendorId, categoryId]
        );
        acmeCrmId = systemResult.rows[0]?.id ?? null;

        await client.query(
          `INSERT INTO systems (
             vendor_id, category_id, name, slug, tagline, description,
             industry, target_size, deployment_type, pricing_tier, starting_price,
             has_api, trial_available, verified, rating, review_count,
             status, is_scraped, is_claimed
           ) VALUES (
             NULL, $1, 'Unclaimed HelpDesk X', 'unclaimed-helpdesk-x',
             'Scraped helpdesk solution',
             'This system was scraped and has not been claimed by a vendor yet.',
             'SaaS', 'SMB', 'Cloud', 'freemium', 'Free',
             false, true, false, 3.2, 5,
             'active', true, false
           )
           ON CONFLICT (slug) DO NOTHING`,
          [categoryId]
        );
      }
    }

    if (demoUserId && vendorId && acmeCrmId) {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM vendor_threads
         WHERE user_id = $1 AND vendor_id = $2 AND system_id = $3
         LIMIT 1`,
        [demoUserId, vendorId, acmeCrmId]
      );

      let threadId = existing.rows[0]?.id;
      if (!threadId) {
        const thread = await client.query<{ id: string }>(
          `INSERT INTO vendor_threads (vendor_id, system_id, user_id, subject, last_message, vendor_unread_count)
           VALUES ($1, $2, $3, 'Question about Acme CRM Pro', 'Hi, does Acme CRM Pro integrate with Salesforce?', 1)
           RETURNING id`,
          [vendorId, acmeCrmId, demoUserId]
        );
        threadId = thread.rows[0]?.id;
      }

      if (threadId) {
        await client.query(
          `INSERT INTO messages (thread_id, sender_id, body)
           SELECT $1, $2, 'Hi, does Acme CRM Pro integrate with Salesforce?'
           WHERE NOT EXISTS (
             SELECT 1 FROM messages WHERE thread_id = $1
           )`,
          [threadId, demoUserId]
        );
        console.log("thread  demo user ↔ acme vendor");
      }
    }

    console.log("Seed complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
