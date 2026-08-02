CREATE TABLE public.streak_shields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shield_date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('freeze','rest')),
  cost integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, shield_date)
);
GRANT SELECT, INSERT ON public.streak_shields TO authenticated;
GRANT SELECT ON public.streak_shields TO anon;
GRANT ALL ON public.streak_shields TO service_role;
ALTER TABLE public.streak_shields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shields viewable by everyone" ON public.streak_shields FOR SELECT USING (true);
CREATE POLICY "Users can buy own shields" ON public.streak_shields FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.app_copy (
  key text NOT NULL PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_copy TO authenticated;
GRANT SELECT ON public.app_copy TO anon;
GRANT ALL ON public.app_copy TO service_role;
ALTER TABLE public.app_copy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Copy viewable by everyone" ON public.app_copy FOR SELECT USING (true);