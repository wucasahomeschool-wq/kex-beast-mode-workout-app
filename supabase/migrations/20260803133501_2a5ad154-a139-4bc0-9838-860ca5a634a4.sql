ALTER TABLE public.app_copy ADD COLUMN IF NOT EXISTS style jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.app_copy ALTER COLUMN value SET DEFAULT '';