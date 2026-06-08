import bcrypt from "bcryptjs";
import pg from "pg";

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

      if (u.role === "vendor") {
        const vendor = await client.query<{ id: string }>(
          `INSERT INTO vendors (owner_user_id, company_name, slug, logo_url, website, verification_status, description)
           VALUES ($1, 'Acme Software', 'acme-software', null, 'https://acme.local', 'verified',
                   'Enterprise software solutions for growing businesses.')
           ON CONFLICT (slug) DO UPDATE SET owner_user_id = EXCLUDED.owner_user_id
           RETURNING id`,
          [userId]
        );
        const vendorId = vendor.rows[0].id;
        await client.query(
          `INSERT INTO vendor_members (vendor_id, user_id, role, can_manage_systems, can_manage_team, can_respond_messages)
           VALUES ($1, $2, 'owner', true, true, true)
           ON CONFLICT (vendor_id, user_id) DO NOTHING`,
          [vendorId, userId]
        );

        const crm = await client.query<{ id: string }>(
          "SELECT id FROM categories WHERE slug = 'crm' LIMIT 1"
        );
        const categoryId = crm.rows[0]?.id;

        await client.query(
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
           ON CONFLICT (slug) DO NOTHING`,
          [vendorId, categoryId]
        );

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
