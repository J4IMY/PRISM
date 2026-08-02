ALTER TABLE scraper_items
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
