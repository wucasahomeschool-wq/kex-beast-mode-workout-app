
-- Profiles: username-only accounts
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX profiles_username_lower_idx ON public.profiles (LOWER(username));
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Workout logs
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  category TEXT NOT NULL,
  difficulty INT NOT NULL,
  routine_name TEXT NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  exercises JSONB NOT NULL,
  plank_seconds INT NOT NULL DEFAULT 0,
  pullup_reps INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX workout_logs_user_completed_idx ON public.workout_logs (user_id, completed_at DESC);
CREATE INDEX workout_logs_completed_idx ON public.workout_logs (completed_at DESC);
GRANT SELECT ON public.workout_logs TO anon;
GRANT SELECT, INSERT ON public.workout_logs TO authenticated;
GRANT ALL ON public.workout_logs TO service_role;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workout logs viewable by everyone"
  ON public.workout_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert own logs"
  ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User preferences (excluded exercises)
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  excluded_exercises TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own prefs"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
