
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users & auth ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'vendor', 'moderator', 'admin')),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  theme TEXT NOT NULL DEFAULT 'system'
    CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL
    CHECK (type IN ('email_verification', 'password_reset', 'vendor_claim')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Vendors ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  company_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  social_links JSONB NOT NULL DEFAULT '{}',
  video_links JSONB NOT NULL DEFAULT '[]',
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  can_manage_systems BOOLEAN NOT NULL DEFAULT false,
  can_manage_team BOOLEAN NOT NULL DEFAULT false,
  can_respond_messages BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (vendor_id, user_id)
);

CREATE TABLE IF NOT EXISTS vendor_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Catalog ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT,
  type TEXT,
  demo_url TEXT,
  industry TEXT,
  target_size TEXT,
  deployment_type TEXT,
  pricing_tier TEXT,
  starting_price TEXT,
  has_api BOOLEAN NOT NULL DEFAULT false,
  has_mobile_app BOOLEAN NOT NULL DEFAULT false,
  has_ai_features BOOLEAN NOT NULL DEFAULT false,
  has_offline_mode BOOLEAN NOT NULL DEFAULT false,
  trial_available BOOLEAN NOT NULL DEFAULT false,
  enterprise_pricing BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  logo_url TEXT,
  website_url TEXT,
  security_certifications TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  is_scraped BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  scraper_item_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'screenshot')),
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_value BOOLEAN NOT NULL DEFAULT true,
  feature_detail TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS system_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  integration_name TEXT NOT NULL,
  integration_type TEXT,
  api_available BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price TEXT,
  billing_cycle TEXT,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  features TEXT[] NOT NULL DEFAULT '{}',
  max_seats INT
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  pros TEXT,
  cons TEXT,
  review_text TEXT,
  is_verified_customer BOOLEAN NOT NULL DEFAULT false,
  admin_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (admin_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Scraper & claims ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scraper_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  confidence NUMERIC(5, 2) NOT NULL DEFAULT 0,
  age_days INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  payload JSONB NOT NULL DEFAULT '{}',
  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE systems
  DROP CONSTRAINT IF EXISTS systems_scraper_item_id_fkey;
ALTER TABLE systems
  ADD CONSTRAINT systems_scraper_item_id_fkey
  FOREIGN KEY (scraper_item_id) REFERENCES scraper_items(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS system_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  claim_email TEXT NOT NULL,
  domain_verified BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMPTZ
);

-- ─── Messaging ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendor_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  system_id UUID REFERENCES systems(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  last_message TEXT,
  unread_count INT NOT NULL DEFAULT 0,
  vendor_unread_count INT NOT NULL DEFAULT 0,
  messaging_blocked BOOLEAN NOT NULL DEFAULT false,
  assigned_member_id UUID REFERENCES vendor_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS thread_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES vendor_threads(id) ON DELETE CASCADE,
  assigned_member_id UUID NOT NULL REFERENCES vendor_members(id),
  assigned_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES vendor_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── User data ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, system_id)
);

CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sla_days_left INT NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  answers JSONB NOT NULL,
  recommendations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens (token);
CREATE INDEX IF NOT EXISTS idx_vendors_owner ON vendors (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_members_vendor ON vendor_members (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_members_user ON vendor_members (user_id);
CREATE INDEX IF NOT EXISTS idx_systems_slug ON systems (slug);
CREATE INDEX IF NOT EXISTS idx_systems_vendor ON systems (vendor_id);
CREATE INDEX IF NOT EXISTS idx_systems_category ON systems (category_id);
CREATE INDEX IF NOT EXISTS idx_systems_status ON systems (status);
CREATE INDEX IF NOT EXISTS idx_scraper_items_status ON scraper_items (status);
CREATE INDEX IF NOT EXISTS idx_vendor_threads_user ON vendor_threads (user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_threads_vendor ON vendor_threads (vendor_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);

-- ─── Seed categories ────────────────────────────────────────────────────────

INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('CRM', 'crm', 'Customer relationship management', 'users', 1),
  ('ERP', 'erp', 'Enterprise resource planning', 'building', 2),
  ('Helpdesk', 'helpdesk', 'Customer support & ticketing', 'headphones', 3),
  ('HR', 'hr', 'Human resources & payroll', 'user-check', 4),
  ('Marketing', 'marketing', 'Marketing automation', 'megaphone', 5),
  ('Analytics', 'analytics', 'Business intelligence & analytics', 'bar-chart', 6),
  ('Security', 'security', 'Cybersecurity and identity management', 'shield', 7),
  ('Project Management', 'project-management', 'Project and task management', 'kanban', 8),
  ('Communication', 'communication', 'Team chat and collaboration', 'message-circle', 9),
  ('Finance', 'finance', 'Accounting and financial software', 'dollar-sign', 10),
  ('DevOps', 'devops', 'CI/CD and infrastructure tools', 'server', 11),
  ('eCommerce', 'ecommerce', 'Online store and retail platforms', 'shopping-cart', 12)
ON CONFLICT (slug) DO NOTHING;

-- Migration: 002_push_tokens.sql
-- Push notification device tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens (user_id);

-- Migration: 003_vendor_application.sql
-- Track vendor signup intent for first-login onboarding redirect
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS vendor_application BOOLEAN NOT NULL DEFAULT false;

-- Migration: 004_vendor_metadata_and_relations.sql
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS founded_date TEXT;

CREATE TABLE IF NOT EXISTS technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_technologies_vendor ON technologies (vendor_id);
CREATE INDEX IF NOT EXISTS idx_contacts_vendor ON contacts (vendor_id);

-- Migration: 005_enhanced_pricing.sql
-- Extend pricing_plans table with enhanced pricing configuration

ALTER TABLE pricing_plans
  DROP CONSTRAINT IF EXISTS pricing_plans_system_id_fkey;

DROP TABLE IF EXISTS package_features;

CREATE TABLE IF NOT EXISTS pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN (
    'per_user', 'per_organization', 'per_device', 'per_transaction',
    'usage_based', 'tiered_usage', 'monthly_subscription', 'annual_subscription',
    'one_time', 'freemium', 'free', 'custom', 'contact_sales'
  )),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN (
    'USD', 'EUR', 'GBP', 'KES', 'ZAR', 'NGN', 'CAD', 'AUD', 'Other'
  )),
  base_price NUMERIC(12, 2),
  billing_cadence TEXT CHECK (billing_cadence IN ('monthly', 'annual', 'quarterly', 'one_time')),
  is_free BOOLEAN NOT NULL DEFAULT false,
  contact_sales BOOLEAN NOT NULL DEFAULT false,
  trial_available BOOLEAN NOT NULL DEFAULT false,
  trial_duration_days INT CHECK (trial_duration_days IN (7, 14, 30, 60, 90) OR trial_duration_days IS NULL),
  minimum_seats INT CHECK (minimum_seats IS NULL OR minimum_seats >= 1),
  maximum_seats INT CHECK (maximum_seats IS NULL OR maximum_seats >= 1),
  is_unlimited_seats BOOLEAN NOT NULL DEFAULT false,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS package_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES pricing_packages(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (package_id, feature_name)
);

-- Migrate existing pricing_plans data to pricing_packages
INSERT INTO pricing_packages (id, system_id, name, pricing_model, currency, base_price, billing_cadence, is_popular, display_order)
SELECT
  id,
  system_id,
  name,
  CASE
    WHEN price IS NULL THEN 'free'
    ELSE 'per_user'
  END,
  'USD',
  CASE
    WHEN price ~ '^[0-9]+\.00$' THEN (regexp_replace(price, '\.00$', '')::INT)::NUMERIC
    ELSE price::NUMERIC
  END,
  CASE
    WHEN billing_cycle = 'Monthly' THEN 'monthly'
    WHEN billing_cycle = 'Annual' THEN 'annual'
    ELSE NULL
  END,
  is_popular,
  row_number() OVER (PARTITION BY system_id ORDER BY id) - 1
FROM pricing_plans;

-- Migrate features
INSERT INTO package_features (package_id, feature_name)
SELECT id, unnest(features)
FROM pricing_plans
WHERE features IS NOT NULL AND array_length(features, 1) > 0;

-- Drop old table after migration
DROP TABLE IF EXISTS pricing_plans;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_packages_system ON pricing_packages (system_id);
CREATE INDEX IF NOT EXISTS idx_pricing_packages_order ON pricing_packages (system_id, display_order);
CREATE INDEX IF NOT EXISTS idx_package_features_package ON package_features (package_id);
CREATE INDEX IF NOT EXISTS idx_package_features_name ON package_features (feature_name);

-- Migration: 006_vendor_location.sql
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Migration: 007_vendor_location_label.sql
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS location_label TEXT;

-- Migration: 008_vendor_industry.sql
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS industry TEXT;

-- Migration: 009_fix_trial_duration_days.sql
UPDATE pricing_packages
SET trial_duration_days = NULL
WHERE trial_duration_days IS NOT NULL
  AND trial_duration_days NOT IN (7, 14, 30, 60, 90);

-- Migration: 010_systems_icon.sql
ALTER TABLE systems
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- Migration: 011_user_username.sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

UPDATE users SET username = 'user_' || SUBSTRING(id::text, 1, 8) WHERE username IS NULL;

-- Migration: 012_system_requirements.sql
ALTER TABLE systems
  ADD COLUMN IF NOT EXISTS implementation_cost NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Migration: 013_admin_suspend_users.sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

-- Migration: 014_scraper_assignments.sql
ALTER TABLE scraper_items
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);

-- Data export
BEGIN;
TRUNCATE TABLE "package_features" RESTART IDENTITY CASCADE;
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('0a0487f7-41ba-4d1f-b3fb-78bd3dc26821', '5b07c1c2-e7f0-4858-9cd7-c8820a946be8', 'Contact Management', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('bfdab98f-9ea9-452c-a643-ebf091d3be6b', '5b07c1c2-e7f0-4858-9cd7-c8820a946be8', 'Email Integration', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('94cd3afd-a5c8-4fee-8115-3db9b418ffe1', '5b07c1c2-e7f0-4858-9cd7-c8820a946be8', 'Basic Reporting', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('d668a632-0df3-4d32-999b-9568739e3b54', '2d4360a8-f132-473d-b851-38239674a342', 'Sales Pipeline', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('26f21fd4-54cc-4352-bdd0-be2084b16ebc', '2d4360a8-f132-473d-b851-38239674a342', 'Advanced Reporting', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('baad9073-bbdc-4de2-85ef-395cf72175b3', '2d4360a8-f132-473d-b851-38239674a342', 'Mobile App', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('52d65496-424b-4f0f-9712-237e86b511a0', '2d4360a8-f132-473d-b851-38239674a342', 'API Access', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('12368102-41b7-4f39-9341-59c6555aa0fb', '9261cc9e-2830-4d6d-84a7-6c534d08cc29', 'Custom Reporting', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('c54a6e14-a3b2-4f01-ae6c-987f7833fa49', '9261cc9e-2830-4d6d-84a7-6c534d08cc29', 'Dedicated Support', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('e9827fd5-497d-4ad9-829c-a7abfc15b744', '9261cc9e-2830-4d6d-84a7-6c534d08cc29', 'SSO', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('75221a5f-1ec2-4977-835f-0f46ce1b6ec0', '9261cc9e-2830-4d6d-84a7-6c534d08cc29', 'Advanced Security', '2026-07-28T16:26:00.715Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('036b764f-fe7b-4f47-b5ff-4f1bfe6e15a1', '67790ffc-1667-4b3d-9b42-407864a42a7b', 'Property Management', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('5e8e49d6-5143-41d5-a3f8-d23dd871d11b', '67790ffc-1667-4b3d-9b42-407864a42a7b', 'Point of Sale', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('66558946-5524-4202-a6a3-7de68eab4289', '67790ffc-1667-4b3d-9b42-407864a42a7b', 'Basic Reporting', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('47165ef5-1380-4b68-9573-6123442a839c', 'bb171c5b-bbdc-4909-bbe0-049956a405a7', 'Property Management', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('cf831d61-151a-4123-aaec-b07a142b0621', 'bb171c5b-bbdc-4909-bbe0-049956a405a7', 'Point of Sale', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('291dd30a-5d35-4aba-8ef1-43a8dcb0d161', 'bb171c5b-bbdc-4909-bbe0-049956a405a7', 'Inventory Management', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('8bd13301-eecf-461b-8245-cb8f8e0ce879', 'bb171c5b-bbdc-4909-bbe0-049956a405a7', 'Accounting', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('f38046c9-4893-48ec-baed-225ce02bdae7', 'bb171c5b-bbdc-4909-bbe0-049956a405a7', 'Housekeeping', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('ae355586-38b5-49eb-95b9-5cd7520d2545', 'ca5c1e62-45b5-4623-ac5a-13aba945c48a', 'Multi-Property', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('06f016d6-57ee-48a5-b3a1-68bcd912052a', 'ca5c1e62-45b5-4623-ac5a-13aba945c48a', 'Custom Reports', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('b4b92b95-9ffa-4a6d-aec2-f8b4688f60dd', 'ca5c1e62-45b5-4623-ac5a-13aba945c48a', 'Dedicated Support', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('d243dded-befc-45b8-a2b4-c243863195f5', 'ca5c1e62-45b5-4623-ac5a-13aba945c48a', 'On-site Training', '2026-07-28T16:26:00.740Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('3b8754c1-4b57-4964-85d3-680484bb1841', 'ec6b3177-355e-4417-8104-c7f1cdb01927', 'Contact Management', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('84269a78-8fae-4788-afd5-c2470364091a', 'ec6b3177-355e-4417-8104-c7f1cdb01927', 'Email Integration', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('0036bf2e-f973-4ab4-b389-6da9022e001c', 'ec6b3177-355e-4417-8104-c7f1cdb01927', 'Basic Reporting', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('36e4a5e3-9b1a-46c8-b98d-9b2c1083aa0a', '5d778bb9-81f9-46be-be38-b5cb91f11b48', 'Sales Pipeline', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('a03991ff-3847-4144-af61-a82635b47cd7', '5d778bb9-81f9-46be-be38-b5cb91f11b48', 'Advanced Reporting', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('c3c0836e-ae3d-435a-ac8e-605d7fc798e4', '5d778bb9-81f9-46be-be38-b5cb91f11b48', 'Mobile App', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('f1573f41-0e8c-4d68-a1a6-755c5d2a5329', '5d778bb9-81f9-46be-be38-b5cb91f11b48', 'API Access', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('a81a9cf1-7878-4199-8477-7927fe8ca1c0', '1ec7b23f-75f1-4e2a-aa3a-7f9c225b76ec', 'Custom Reporting', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('ded0463c-4dea-49ac-bd55-5a9ac99f5119', '1ec7b23f-75f1-4e2a-aa3a-7f9c225b76ec', 'Dedicated Support', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('c62ca74c-dc27-47fa-85c1-84e59643daeb', '1ec7b23f-75f1-4e2a-aa3a-7f9c225b76ec', 'SSO', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('ff8aae85-b315-428f-91d6-a7c3c1b6c8e7', '1ec7b23f-75f1-4e2a-aa3a-7f9c225b76ec', 'Advanced Security', '2026-07-28T16:27:04.553Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('28c3bdf7-ebcf-406d-8500-6c0f99b481a0', '0d0c27e4-236c-43e4-adad-cfe8d25af14b', 'Property Management', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('37970df0-1ca9-4460-9780-8c1e13d75f9e', '0d0c27e4-236c-43e4-adad-cfe8d25af14b', 'Point of Sale', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('3656036b-7ce5-424b-b094-0687a5ee9822', '0d0c27e4-236c-43e4-adad-cfe8d25af14b', 'Basic Reporting', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('c3d4c0f2-3e63-4bc6-ad0c-a498331dd764', '3189ed42-e2d7-4cc2-8e6b-6711f2dae9dc', 'Property Management', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('86bd47b6-c98c-4440-b29c-267b5df9069c', '3189ed42-e2d7-4cc2-8e6b-6711f2dae9dc', 'Point of Sale', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('ba6ef0cf-ad2d-4893-8b8f-f7d16cff6035', '3189ed42-e2d7-4cc2-8e6b-6711f2dae9dc', 'Inventory Management', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('2637e50c-bf01-43b7-aa71-dcd8baa06e02', '3189ed42-e2d7-4cc2-8e6b-6711f2dae9dc', 'Accounting', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('729a661b-c284-4cc7-a095-6bb37d39364c', '3189ed42-e2d7-4cc2-8e6b-6711f2dae9dc', 'Housekeeping', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('9b9c432a-bb44-44d7-953c-4f8794bf667f', '703bf621-abac-4ccb-8243-c50641c38aca', 'Multi-Property', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('e280e1da-4d1d-4329-9a05-c2b05888fc3d', '703bf621-abac-4ccb-8243-c50641c38aca', 'Custom Reports', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('89e41d22-7ee6-476e-b7ee-f0125bc70b8c', '703bf621-abac-4ccb-8243-c50641c38aca', 'Dedicated Support', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('2aafded5-1a9f-4320-bf0e-ff871e5b7929', '703bf621-abac-4ccb-8243-c50641c38aca', 'On-site Training', '2026-07-28T16:27:04.577Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('dbbdf4bf-4bf3-459c-8535-5f87d6f88460', '248a1289-4c6d-47fa-bdcf-a82cd5036214', 'Ticket Management', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('3ee0a52c-8abf-4e2a-ba73-0c7cdf360540', '248a1289-4c6d-47fa-bdcf-a82cd5036214', 'Knowledge Base', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('321b2cfa-5da3-456b-b177-c8d670a8acb6', '248a1289-4c6d-47fa-bdcf-a82cd5036214', 'Email Support', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('6f975c52-1dc3-412d-a451-b19058c0807f', 'd01fa9b3-c9d7-4d18-acd6-a7308851d1ab', 'AI Routing', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('4c4ecf51-915e-44de-93c3-a296db797843', 'd01fa9b3-c9d7-4d18-acd6-a7308851d1ab', 'SLA Management', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('9ceb5513-a4c1-4e58-89c3-5cc419022e29', 'd01fa9b3-c9d7-4d18-acd6-a7308851d1ab', 'Analytics', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('6f4822a1-143c-4739-bd52-c44d403892c1', 'd01fa9b3-c9d7-4d18-acd6-a7308851d1ab', 'Omnichannel', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('d35219b9-4041-47a1-8f6f-a0df410b2a9b', '908ac9eb-2593-43eb-9cfa-be6da5cd3ef0', 'Advanced Analytics', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('a194cd16-7beb-469f-9db4-a9a70f988247', '908ac9eb-2593-43eb-9cfa-be6da5cd3ef0', 'Custom Workflows', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('26175e13-d2a4-4954-8fa5-058e06164009', '908ac9eb-2593-43eb-9cfa-be6da5cd3ef0', 'Priority Support', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('cefed3b1-cc44-460a-8198-bab21582b2ab', '908ac9eb-2593-43eb-9cfa-be6da5cd3ef0', 'SSO', '2026-07-28T16:27:04.608Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('eadfa2bd-7f1e-4e04-8585-cc59a47c60fb', '2175bbc2-db5c-4954-8d0d-df9ec9fca17a', 'Mobile App', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('af07fece-d02a-4285-9e92-b64306949565', '2175bbc2-db5c-4954-8d0d-df9ec9fca17a', 'Custom Reports', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('09335167-395f-48dd-bd08-c7a95da07ca6', '2175bbc2-db5c-4954-8d0d-df9ec9fca17a', 'Analytics', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('6b22e201-b0fe-4634-843b-812a3e773359', '2175bbc2-db5c-4954-8d0d-df9ec9fca17a', 'Accounting', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('54125ecc-4ded-4f15-b62b-436907f963ae', '2175bbc2-db5c-4954-8d0d-df9ec9fca17a', 'API', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('831a6e95-e94b-4d96-9720-d2c5fdd47c2a', '041f8986-f747-4981-8cd9-5d9365f09db0', 'API', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('a842d249-9bb8-44f1-8ebb-9e2ae70499ee', '94028cb8-d244-416a-bd3d-0f64f2687b89', 'Basic Inventory', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('01bfc609-0f89-4968-a4a5-240a60ada8c9', '94028cb8-d244-416a-bd3d-0f64f2687b89', '1 User', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('469d26fe-9a02-4bbb-b2b8-e87bde7c28cb', '94028cb8-d244-416a-bd3d-0f64f2687b89', 'Email Support', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('80245a99-a032-47be-bc6f-b16895b0f1f1', '7df3a7d6-3b42-4eb9-83da-c966082ed8e7', 'Unlimited Users', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('ccbc21c3-4d70-4705-91d0-842e673e5843', '7df3a7d6-3b42-4eb9-83da-c966082ed8e7', 'Dedicated Support', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('42bb7b95-1e4d-4603-a076-4d9543a58c87', '7df3a7d6-3b42-4eb9-83da-c966082ed8e7', 'Custom Integrations', '2026-07-28T16:46:37.426Z');
INSERT INTO "package_features" ("id", "package_id", "feature_name", "created_at") VALUES ('c6fe5fe4-5a62-46a0-aaa8-da8be5fffc8c', '7df3a7d6-3b42-4eb9-83da-c966082ed8e7', 'On-premise Option', '2026-07-28T16:46:37.426Z');

TRUNCATE TABLE "system_integrations" RESTART IDENTITY CASCADE;
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('39d420e0-0602-456a-907d-cc05549c309e', '03f3c344-4cd3-42b7-974f-b32b93214733', 'Microsoft 365', 'productivity', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('ad3ac38c-3856-414f-b2bf-65073e2bbe32', '03f3c344-4cd3-42b7-974f-b32b93214733', 'Google Workspace', 'productivity', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('1cf6c6cf-8f6b-4455-8db0-d02ccbbc1950', '03f3c344-4cd3-42b7-974f-b32b93214733', 'Payment Gateway', 'finance', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('68a83ee1-0f45-49fa-9f02-9815c1467e2d', '03f3c344-4cd3-42b7-974f-b32b93214733', 'Shopify', 'ecommerce', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('c12acb08-3ca8-4c00-bb66-c965aa1dc40a', '03f3c344-4cd3-42b7-974f-b32b93214733', 'APIs', 'developer', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('ea120837-fa4c-4313-9674-6e5410364221', '0c450ae4-36ab-45c6-9ded-380189f5dd78', 'Payment Gateway', 'finance', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('3bf39aac-3e6c-44d0-a076-cb2f2e063296', '0c450ae4-36ab-45c6-9ded-380189f5dd78', 'Google Workspace', 'productivity', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('8755ffad-bc3d-472f-afb8-910b0a50ac98', '0c450ae4-36ab-45c6-9ded-380189f5dd78', 'APIs', 'developer', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('030dcad0-65f2-4613-9900-dd37b9fc4d79', '03f3c344-4cd3-42b7-974f-b32b93214733', 'Microsoft 365', 'productivity', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('0b4f9e44-904b-4ca5-bf84-986ad7484870', '03f3c344-4cd3-42b7-974f-b32b93214733', 'Google Workspace', 'productivity', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('2a35d74e-de22-4dbe-a201-319390902607', '03f3c344-4cd3-42b7-974f-b32b93214733', 'Payment Gateway', 'finance', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('bccf03a9-7c61-4cfa-a852-4c7d784dde39', '03f3c344-4cd3-42b7-974f-b32b93214733', 'Shopify', 'ecommerce', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('78529353-4d48-4ac7-8345-224c3049efd7', '03f3c344-4cd3-42b7-974f-b32b93214733', 'APIs', 'developer', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('a1435a07-f944-4d17-94ed-e6729b795170', '0c450ae4-36ab-45c6-9ded-380189f5dd78', 'Payment Gateway', 'finance', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('46bb6177-dc05-4eca-a92d-84ec0ce3fc6e', '0c450ae4-36ab-45c6-9ded-380189f5dd78', 'Google Workspace', 'productivity', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('8d52aaf2-5b9c-44a3-beba-c96bab2dcedc', '0c450ae4-36ab-45c6-9ded-380189f5dd78', 'APIs', 'developer', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('058c4543-a5ce-4c07-9376-e519d67b711d', 'f1c97f94-01d1-4482-924d-04318664618a', 'Payment Gateway', 'finance', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('0f6177f4-db36-430d-b85a-61f4edb8c64d', 'f1c97f94-01d1-4482-924d-04318664618a', 'Shopify', 'ecommerce', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('d0e5b1ca-0bdd-424c-aa9a-8158ec02b1cb', 'f1c97f94-01d1-4482-924d-04318664618a', 'APIs', 'developer', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('7714cd19-ab54-43c2-b56f-b93cf2e70da8', '4ad1df12-b95c-44f5-8259-2ac9316004ee', 'Microsoft 365', 'productivity', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('38e5c8c3-68a7-4715-982f-e361712f8763', '4ad1df12-b95c-44f5-8259-2ac9316004ee', 'Google Workspace', 'productivity', true);
INSERT INTO "system_integrations" ("id", "system_id", "integration_name", "integration_type", "api_available") VALUES ('2e6744b6-4686-4e63-b1a5-27309bf59b78', '4ad1df12-b95c-44f5-8259-2ac9316004ee', 'APIs', 'developer', true);
TRUNCATE TABLE "watchlist" RESTART IDENTITY CASCADE;
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('d405f756-d9c8-4341-870f-be07d9af9dec', '3a6e5351-cd3f-49eb-a8d2-1f6a2557c772', '4ad1df12-b95c-44f5-8259-2ac9316004ee', '2026-06-09T09:57:42.238Z');
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('11be42b1-2ab6-4209-9681-5cdc6b50d1ad', 'b3b3c146-1421-4321-b167-7101d3a7a44e', '1d7b2a1f-9d71-4388-940d-2b84f52128ef', '2026-07-03T12:50:50.436Z');
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('6fce2a17-2c53-46cc-b663-72e923177108', 'b3b3c146-1421-4321-b167-7101d3a7a44e', '03f3c344-4cd3-42b7-974f-b32b93214733', '2026-07-09T11:41:51.476Z');
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('9ac6c9e6-e225-4624-8d0a-1f82fa4be588', 'b3b3c146-1421-4321-b167-7101d3a7a44e', 'f1c97f94-01d1-4482-924d-04318664618a', '2026-07-21T15:25:25.514Z');
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('4d011e1c-065f-4c72-85c2-966fe5ade24a', 'd4c6ecfc-cb85-4ab3-a44b-62d075d8fdda', 'f1c97f94-01d1-4482-924d-04318664618a', '2026-07-23T08:45:31.753Z');
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('cb90c435-2119-4c28-bc78-9d514225a197', 'd4c6ecfc-cb85-4ab3-a44b-62d075d8fdda', '03f3c344-4cd3-42b7-974f-b32b93214733', '2026-07-23T09:01:30.943Z');
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('794b638d-49c8-455b-8d03-cfba03a498e3', '3a6e5351-cd3f-49eb-a8d2-1f6a2557c772', '03f3c344-4cd3-42b7-974f-b32b93214733', '2026-07-29T13:27:30.781Z');
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('2c15ccfd-b96a-412a-924e-4b632c561c91', 'ac3aadf0-5646-4f6f-8aab-e5006a7b522f', 'f1c97f94-01d1-4482-924d-04318664618a', '2026-07-29T14:50:48.899Z');
INSERT INTO "watchlist" ("id", "user_id", "system_id", "created_at") VALUES ('b80918a3-c1d6-4acc-a620-ac08f22a7aaf', 'ac3aadf0-5646-4f6f-8aab-e5006a7b522f', '03f3c344-4cd3-42b7-974f-b32b93214733', '2026-07-30T12:30:41.359Z');
COMMIT;
