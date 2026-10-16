ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS skipped boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, exercise_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_notes TO anon, authenticated;
GRANT ALL ON public.session_notes TO service_role;

ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access to session notes" ON public.session_notes FOR ALL USING (true) WITH CHECK (true);