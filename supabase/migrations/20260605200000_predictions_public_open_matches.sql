-- FK predictions -> profiles (pentru join-uri PostgREST)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'predictions_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.predictions
      ADD CONSTRAINT predictions_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Toți participanții pot vedea pronosticurile pentru meciurile încă deschise
CREATE POLICY "pred_select_open_matches" ON public.predictions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.status IN ('scheduled', 'postponed')
        AND (m.home_score IS NULL OR m.status <> 'finished')
        AND m.kickoff_at > now() + interval '1 hour'
    )
  );
