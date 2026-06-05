-- External IDs for football-data.org sync (teams + matches)

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS external_id TEXT;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS teams_external_id_unique
  ON public.teams (external_id)
  WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS matches_external_id_unique
  ON public.matches (external_id)
  WHERE external_id IS NOT NULL;
