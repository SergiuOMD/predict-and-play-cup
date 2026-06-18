-- Statistici extinse clasament: scoruri ghicite/prognozate, meciuri, departajare

CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  COALESCE(SUM(pr.points), 0)::INT AS match_points,
  COALESCE(SUM(pr.points), 0)::INT AS guessed_scores,
  (COUNT(pr.id) * 3)::INT AS predicted_scores,
  COUNT(pr.id)::INT AS matches_predicted,
  COALESCE(CASE WHEN ts.champion_team_id IS NOT NULL AND bp.champion_team_id = ts.champion_team_id THEN ts.champion_points ELSE 0 END, 0)::INT AS champion_points,
  COALESCE(CASE WHEN ts.top_scorer_name IS NOT NULL AND LOWER(TRIM(bp.top_scorer_name)) = LOWER(TRIM(ts.top_scorer_name)) THEN ts.top_scorer_points ELSE 0 END, 0)::INT AS top_scorer_points,
  (
    COALESCE(SUM(pr.points), 0)
    + COALESCE(CASE WHEN ts.champion_team_id IS NOT NULL AND bp.champion_team_id = ts.champion_team_id THEN ts.champion_points ELSE 0 END, 0)
    + COALESCE(CASE WHEN ts.top_scorer_name IS NOT NULL AND LOWER(TRIM(bp.top_scorer_name)) = LOWER(TRIM(ts.top_scorer_name)) THEN ts.top_scorer_points ELSE 0 END, 0)
  )::INT AS total_points,
  COUNT(pr.id)::INT AS predictions_count
FROM public.profiles p
LEFT JOIN public.predictions pr ON pr.user_id = p.id
LEFT JOIN public.bonus_predictions bp ON bp.user_id = p.id
LEFT JOIN public.tournament_settings ts ON ts.id = 1
WHERE p.disqualified = false
GROUP BY p.id, p.display_name, p.avatar_url, ts.champion_team_id, ts.champion_points, ts.top_scorer_name, ts.top_scorer_points, bp.champion_team_id, bp.top_scorer_name;

GRANT SELECT ON public.leaderboard TO authenticated;
