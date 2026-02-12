ALTER TABLE vendor_sessions
  ADD COLUMN IF NOT EXISTS is_impersonation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS impersonated_by text;

ALTER TABLE couple_sessions
  ADD COLUMN IF NOT EXISTS is_impersonation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS impersonated_by text;
