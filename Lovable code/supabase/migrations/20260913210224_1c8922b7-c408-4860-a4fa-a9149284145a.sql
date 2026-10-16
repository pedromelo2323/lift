-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ownership columns
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.exercise_sets ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.session_notes ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.bug_reports ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS workouts_user_idx ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS exercises_user_idx ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS exercise_sets_user_idx ON public.exercise_sets(user_id);
CREATE INDEX IF NOT EXISTS session_notes_user_idx ON public.session_notes(user_id);

-- replace open policies with per-user ones
DROP POLICY IF EXISTS "Open access to workouts (no auth in MVP)" ON public.workouts;
DROP POLICY IF EXISTS "Open access to exercises (no auth in MVP)" ON public.exercises;
DROP POLICY IF EXISTS "Open access to sessions (no auth in MVP)" ON public.sessions;
DROP POLICY IF EXISTS "Open access to exercise sets (no auth in MVP)" ON public.exercise_sets;
DROP POLICY IF EXISTS "Public access to session notes" ON public.session_notes;
DROP POLICY IF EXISTS "Open access to bug reports (no auth in MVP)" ON public.bug_reports;

CREATE POLICY "Own workouts" ON public.workouts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own exercises" ON public.exercises FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own sessions" ON public.sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own exercise sets" ON public.exercise_sets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own session notes" ON public.session_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own bug reports" ON public.bug_reports FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_sets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bug_reports TO authenticated;
GRANT ALL ON public.workouts, public.exercises, public.sessions, public.exercise_sets, public.session_notes, public.bug_reports TO service_role;
REVOKE ALL ON public.workouts, public.exercises, public.sessions, public.exercise_sets, public.session_notes, public.bug_reports FROM anon;