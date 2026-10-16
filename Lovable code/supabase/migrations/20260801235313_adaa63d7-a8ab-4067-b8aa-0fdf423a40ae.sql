CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  last_completed_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO anon, authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access to workouts (no auth in MVP)" ON public.workouts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  target_reps text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exercises_workout_id_idx ON public.exercises(workout_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO anon, authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access to exercises (no auth in MVP)" ON public.exercises FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workout_id, date)
);
CREATE INDEX sessions_workout_id_date_idx ON public.sessions(workout_id, date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO anon, authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access to sessions (no auth in MVP)" ON public.sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_index integer NOT NULL,
  weight numeric(6,2),
  reps integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, exercise_id, set_index)
);
CREATE INDEX exercise_sets_exercise_idx ON public.exercise_sets(exercise_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_sets TO anon, authenticated;
GRANT ALL ON public.exercise_sets TO service_role;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access to exercise sets (no auth in MVP)" ON public.exercise_sets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER exercise_sets_touch BEFORE UPDATE ON public.exercise_sets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.workouts (id, name, position) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Push', 0),
  ('22222222-2222-4222-8222-222222222222', 'Pull', 1),
  ('33333333-3333-4333-8333-333333333333', 'Leg/Shoulder', 2);

INSERT INTO public.exercises (workout_id, name, position, target_reps) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Incline Bench Press', 0, '8-10'),
  ('11111111-1111-4111-8111-111111111111', 'Dips', 1, '8-12'),
  ('11111111-1111-4111-8111-111111111111', 'Chest Fly', 2, '10-12'),
  ('11111111-1111-4111-8111-111111111111', 'Behind Head Tricep', 3, '10-12'),
  ('11111111-1111-4111-8111-111111111111', 'Tricep Cable Pushdowns', 4, '10-12'),
  ('22222222-2222-4222-8222-222222222222', 'Pull Ups', 0, '6-10'),
  ('22222222-2222-4222-8222-222222222222', 'Barbell Row', 1, '8-10'),
  ('22222222-2222-4222-8222-222222222222', 'Lat Pulldown', 2, '10-12'),
  ('22222222-2222-4222-8222-222222222222', 'Seated Cable Row', 3, '10-12'),
  ('22222222-2222-4222-8222-222222222222', 'Bicep Curl', 4, '10-12'),
  ('33333333-3333-4333-8333-333333333333', 'Squat', 0, '6-8'),
  ('33333333-3333-4333-8333-333333333333', 'Romanian Deadlift', 1, '8-10'),
  ('33333333-3333-4333-8333-333333333333', 'Leg Press', 2, '10-12'),
  ('33333333-3333-4333-8333-333333333333', 'Shoulder Press', 3, '8-10'),
  ('33333333-3333-4333-8333-333333333333', 'Lateral Raises', 4, '12-15');