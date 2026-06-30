-- Scor introdus manual de admin: nu se suprascrie la import/sync auto
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS score_locked BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS matches_score_locked_idx ON public.matches (score_locked)
  WHERE score_locked = true;
