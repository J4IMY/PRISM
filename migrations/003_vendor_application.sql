-- Track vendor signup intent for first-login onboarding redirect
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS vendor_application BOOLEAN NOT NULL DEFAULT false;
