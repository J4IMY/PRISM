ALTER TABLE systems
  ADD COLUMN IF NOT EXISTS implementation_cost NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS requirements TEXT;
