-- Add patient profile fields and password login support to existing user records.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN public.users.password_hash IS 'Scrypt password hash for patient login.';