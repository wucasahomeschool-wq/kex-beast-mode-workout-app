CREATE TABLE public.regimens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text NOT NULL DEFAULT '',
  days integer NOT NULL DEFAULT 14,
  difficulty integer NOT NULL DEFAULT 3,
  per_day integer NOT NULL DEFAULT 1,
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_day integer NOT NULL DEFAULT 1,
  completed_days jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  finished boolean NOT NULL DEFAULT false,
  jackpot_paid boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.regimens TO authenticated;
GRANT ALL ON public.regimens TO service_role;

ALTER TABLE public.regimens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own regimens"
ON public.regimens FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX regimens_user_active_idx ON public.regimens (user_id, active);