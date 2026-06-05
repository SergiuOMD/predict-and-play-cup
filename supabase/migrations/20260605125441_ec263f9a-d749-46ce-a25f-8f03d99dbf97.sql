
CREATE TYPE public.match_stage AS ENUM ('group','r32','r16','qf','sf','third_place','final');
CREATE TYPE public.match_status AS ENUM ('scheduled','live','finished','postponed');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id) WITH CHECK (auth.uid()=id);

-- ADMINS
CREATE TABLE public.admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_select" ON public.admins FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.admins a WHERE LOWER(a.email)=LOWER((auth.jwt()->>'email')));
$$;

-- INVITE CODES
CREATE TABLE public.invite_codes (
  code TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  uses_count INT NOT NULL DEFAULT 0,
  max_uses INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_codes TO authenticated;
GRANT ALL ON public.invite_codes TO service_role;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite_admin_all" ON public.invite_codes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.validate_invite_code(_code TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.invite_codes WHERE code=_code AND active=true AND (max_uses IS NULL OR uses_count<max_uses));
$$;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(TEXT) TO anon, authenticated;

-- TEAMS (needed before tournament_settings)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  flag_emoji TEXT,
  group_letter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_select" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_admin_all" ON public.teams FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- TOURNAMENT SETTINGS (before bonus_predictions which references it)
CREATE TABLE public.tournament_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id=1),
  bonus_lock_at TIMESTAMPTZ,
  champion_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  top_scorer_name TEXT,
  champion_points INT NOT NULL DEFAULT 5,
  top_scorer_points INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_settings TO authenticated;
GRANT ALL ON public.tournament_settings TO service_role;
ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON public.tournament_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_admin_all" ON public.tournament_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.tournament_settings (id) VALUES (1);

-- HANDLE NEW USER trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
  v_name TEXT;
  v_provider TEXT;
BEGIN
  v_code := NEW.raw_user_meta_data->>'invite_code';
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email,'@',1)
  );
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider','email');

  IF v_provider = 'email' THEN
    IF v_code IS NULL OR NOT public.validate_invite_code(v_code) THEN
      RAISE EXCEPTION 'Cod de invitatie invalid sau lipsa';
    END IF;
    UPDATE public.invite_codes SET uses_count = uses_count + 1 WHERE code = v_code;
  END IF;

  INSERT INTO public.profiles (id,email,display_name,avatar_url)
  VALUES (NEW.id, NEW.email, v_name, NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MATCHES
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage public.match_stage NOT NULL DEFAULT 'group',
  group_letter TEXT,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  home_team_label TEXT,
  away_team_label TEXT,
  kickoff_at TIMESTAMPTZ NOT NULL,
  venue TEXT,
  home_score INT,
  away_score INT,
  status public.match_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_select" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_admin_all" ON public.matches FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE INDEX matches_kickoff_idx ON public.matches(kickoff_at);
CREATE INDEX matches_stage_idx ON public.matches(stage);

-- PREDICTIONS
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  score1_home INT NOT NULL CHECK (score1_home BETWEEN 0 AND 30),
  score1_away INT NOT NULL CHECK (score1_away BETWEEN 0 AND 30),
  score2_home INT NOT NULL CHECK (score2_home BETWEEN 0 AND 30),
  score2_away INT NOT NULL CHECK (score2_away BETWEEN 0 AND 30),
  score3_home INT NOT NULL CHECK (score3_home BETWEEN 0 AND 30),
  score3_away INT NOT NULL CHECK (score3_away BETWEEN 0 AND 30),
  points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pred_select_own" ON public.predictions FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "pred_select_after_kickoff" ON public.predictions FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.matches m WHERE m.id=match_id AND m.kickoff_at<=now()));
CREATE POLICY "pred_insert_own" ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "pred_update_own" ON public.predictions FOR UPDATE TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "pred_delete_own" ON public.predictions FOR DELETE TO authenticated USING (auth.uid()=user_id);
CREATE INDEX predictions_user_idx ON public.predictions(user_id);
CREATE INDEX predictions_match_idx ON public.predictions(match_id);

CREATE OR REPLACE FUNCTION public.enforce_prediction_lock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_kickoff TIMESTAMPTZ;
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  SELECT kickoff_at INTO v_kickoff FROM public.matches WHERE id = NEW.match_id;
  IF v_kickoff IS NULL THEN RAISE EXCEPTION 'Meciul nu exista'; END IF;
  IF now() > v_kickoff - interval '1 hour' THEN
    RAISE EXCEPTION 'Predictiile sunt blocate (cu 1 ora inainte de kickoff)';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER predictions_lock_insert BEFORE INSERT ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.enforce_prediction_lock();
CREATE TRIGGER predictions_lock_update BEFORE UPDATE ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.enforce_prediction_lock();

CREATE OR REPLACE FUNCTION public.recalc_match_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
    UPDATE public.predictions SET points = 0 WHERE match_id = NEW.id;
    RETURN NEW;
  END IF;
  UPDATE public.predictions p SET points =
    (CASE WHEN p.score1_home=NEW.home_score AND p.score1_away=NEW.away_score THEN 1 ELSE 0 END)+
    (CASE WHEN p.score2_home=NEW.home_score AND p.score2_away=NEW.away_score THEN 1 ELSE 0 END)+
    (CASE WHEN p.score3_home=NEW.home_score AND p.score3_away=NEW.away_score THEN 1 ELSE 0 END)
  WHERE p.match_id = NEW.id;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER matches_recalc_points BEFORE UPDATE OF home_score, away_score ON public.matches FOR EACH ROW EXECUTE FUNCTION public.recalc_match_points();

-- BONUS PREDICTIONS (references tournament_settings)
CREATE TABLE public.bonus_predictions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  champion_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  top_scorer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonus_predictions TO authenticated;
GRANT ALL ON public.bonus_predictions TO service_role;
ALTER TABLE public.bonus_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bonus_select_own" ON public.bonus_predictions FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "bonus_select_after_lock" ON public.bonus_predictions FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.tournament_settings ts WHERE ts.id=1 AND ts.bonus_lock_at IS NOT NULL AND now() >= ts.bonus_lock_at));
CREATE POLICY "bonus_manage_own" ON public.bonus_predictions FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.enforce_bonus_lock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lock TIMESTAMPTZ;
BEGIN
  IF public.is_admin() THEN NEW.updated_at := now(); RETURN NEW; END IF;
  SELECT bonus_lock_at INTO v_lock FROM public.tournament_settings WHERE id=1;
  IF v_lock IS NOT NULL AND now() >= v_lock THEN
    RAISE EXCEPTION 'Predictiile bonus sunt blocate';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER bonus_lock_insert BEFORE INSERT ON public.bonus_predictions FOR EACH ROW EXECUTE FUNCTION public.enforce_bonus_lock();
CREATE TRIGGER bonus_lock_update BEFORE UPDATE ON public.bonus_predictions FOR EACH ROW EXECUTE FUNCTION public.enforce_bonus_lock();

-- LEADERBOARD VIEW
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
GROUP BY p.id, p.display_name, p.avatar_url, ts.champion_team_id, ts.champion_points, ts.top_scorer_name, ts.top_scorer_points, bp.champion_team_id, bp.top_scorer_name;
GRANT SELECT ON public.leaderboard TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_settings;
