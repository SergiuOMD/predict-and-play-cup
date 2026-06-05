-- Urmărire verificări automate scoruri la +3h și +4h de la kickoff

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS auto_score_sync_3h_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_score_sync_4h_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS matches_auto_sync_3h_idx
  ON public.matches (kickoff_at)
  WHERE auto_score_sync_3h_at IS NULL;

CREATE INDEX IF NOT EXISTS matches_auto_sync_4h_idx
  ON public.matches (kickoff_at)
  WHERE auto_score_sync_4h_at IS NULL;
