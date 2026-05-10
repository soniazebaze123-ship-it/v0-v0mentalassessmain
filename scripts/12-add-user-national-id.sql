ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS national_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_national_id_unique_idx
  ON public.users (national_id)
  WHERE national_id IS NOT NULL;

COMMENT ON COLUMN public.users.national_id IS 'Government-issued national ID for patient registration.';
