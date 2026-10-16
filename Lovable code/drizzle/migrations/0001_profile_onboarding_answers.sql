ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS sex text,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS days_per_week integer,
  ADD COLUMN IF NOT EXISTS session_minutes integer,
  ADD COLUMN IF NOT EXISTS experience text,
  ADD COLUMN IF NOT EXISTS plan_generations integer NOT NULL DEFAULT 0;