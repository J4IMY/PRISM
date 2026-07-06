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