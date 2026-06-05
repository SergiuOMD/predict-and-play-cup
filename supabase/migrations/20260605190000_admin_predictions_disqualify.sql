-- Admin moderation: view/delete predictions, disqualify users

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS disqualified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disqualified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disqualified_reason TEXT;

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "pred_admin_select" ON public.predictions
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "pred_admin_delete" ON public.predictions
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.enforce_prediction_lock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_kickoff TIMESTAMPTZ;
BEGIN
  IF public.is_admin() THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id AND disqualified) THEN
    RAISE EXCEPTION 'Contul tău a fost descalificat din competiție';
  END IF;

  SELECT kickoff_at INTO v_kickoff FROM public.matches WHERE id = NEW.match_id;
  IF v_kickoff IS NULL THEN RAISE EXCEPTION 'Meciul nu exista'; END IF;
  IF now() > v_kickoff - interval '1 hour' THEN
    RAISE EXCEPTION 'Predictiile sunt blocate (cu 1 ora inainte de kickoff)';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  COALESCE(SUM(pr.points),0)::INT AS match_points,
  COALESCE(CASE WHEN ts.champion_team_id IS NOT NULL AND bp.champion_team_id=ts.champion_team_id THEN ts.champion_points ELSE 0 END,0)::INT AS champion_points,
  COALESCE(CASE WHEN ts.top_scorer_name IS NOT NULL AND LOWER(TRIM(bp.top_scorer_name))=LOWER(TRIM(ts.top_scorer_name)) THEN ts.top_scorer_points ELSE 0 END,0)::INT AS top_scorer_points,
  (COALESCE(SUM(pr.points),0)
   + COALESCE(CASE WHEN ts.champion_team_id IS NOT NULL AND bp.champion_team_id=ts.champion_team_id THEN ts.champion_points ELSE 0 END,0)
   + COALESCE(CASE WHEN ts.top_scorer_name IS NOT NULL AND LOWER(TRIM(bp.top_scorer_name))=LOWER(TRIM(ts.top_scorer_name)) THEN ts.top_scorer_points ELSE 0 END,0)
  )::INT AS total_points,
  COUNT(pr.id)::INT AS predictions_count
FROM public.profiles p
LEFT JOIN public.predictions pr ON pr.user_id = p.id
LEFT JOIN public.bonus_predictions bp ON bp.user_id = p.id
LEFT JOIN public.tournament_settings ts ON ts.id = 1
WHERE p.disqualified = false
GROUP BY p.id, p.display_name, p.avatar_url, ts.champion_team_id, ts.champion_points, ts.top_scorer_name, ts.top_scorer_points, bp.champion_team_id, bp.top_scorer_name;
