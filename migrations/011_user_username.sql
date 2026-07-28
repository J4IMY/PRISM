ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

UPDATE users SET username = 'user_' || SUBSTRING(id::text, 1, 8) WHERE username IS NULL;
