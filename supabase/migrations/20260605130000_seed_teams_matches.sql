-- Seed data for OMD WC2026 Totalizator (placeholder fixtures for development/demo)

-- Default invite code for email signup
INSERT INTO public.invite_codes (code, active, note, max_uses)
VALUES ('OMDworldcup2026', true, 'Cod implicit de invitație', NULL)
ON CONFLICT (code) DO NOTHING;

-- 12 groups × 4 teams = 48 teams (WC 2026 format)
INSERT INTO public.teams (name, code, flag_emoji, group_letter) VALUES
  ('Brazilia', 'BRA', '🇧🇷', 'A'),
  ('Maroc', 'MAR', '🇲🇦', 'A'),
  ('Croația', 'CRO', '🇭🇷', 'A'),
  ('Japonia', 'JPN', '🇯🇵', 'A'),
  ('Argentina', 'ARG', '🇦🇷', 'B'),
  ('Ecuador', 'ECU', '🇪🇨', 'B'),
  ('Polonia', 'POL', '🇵🇱', 'B'),
  ('Coreea de Sud', 'KOR', '🇰🇷', 'B'),
  ('Franța', 'FRA', '🇫🇷', 'C'),
  ('Danemarca', 'DEN', '🇩🇰', 'C'),
  ('Mexic', 'MEX', '🇲🇽', 'C'),
  ('Canada', 'CAN', '🇨🇦', 'C'),
  ('Anglia', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'D'),
  ('Serbia', 'SRB', '🇷🇸', 'D'),
  ('SUA', 'USA', '🇺🇸', 'D'),
  ('Australia', 'AUS', '🇦🇺', 'D'),
  ('Germania', 'GER', '🇩🇪', 'E'),
  ('Spania', 'ESP', '🇪🇸', 'E'),
  ('Costa Rica', 'CRC', '🇨🇷', 'E'),
  ('Venezuela', 'VEN', '🇻🇪', 'E'),
  ('Belgia', 'BEL', '🇧🇪', 'F'),
  ('Uruguay', 'URU', '🇺🇾', 'F'),
  ('Tunisia', 'TUN', '🇹🇳', 'F'),
  ('Panama', 'PAN', '🇵🇦', 'F'),
  ('Portugalia', 'POR', '🇵🇹', 'G'),
  ('Ghana', 'GHA', '🇬🇭', 'G'),
  ('Elveția', 'SUI', '🇨🇭', 'G'),
  ('Camerun', 'CMR', '🇨🇲', 'G'),
  ('Olanda', 'NED', '🇳🇱', 'H'),
  ('Senegal', 'SEN', '🇸🇳', 'H'),
  ('Iran', 'IRN', '🇮🇷', 'H'),
  ('Wales', 'WAL', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'H'),
  ('Italia', 'ITA', '🇮🇹', 'I'),
  ('Columbia', 'COL', '🇨🇴', 'I'),
  ('Peru', 'PER', '🇵🇪', 'I'),
  ('Qatar', 'QAT', '🇶🇦', 'I'),
  ('Cehia', 'CZE', '🇨🇿', 'J'),
  ('Nigeria', 'NGA', '🇳🇬', 'J'),
  ('Suedia', 'SWE', '🇸🇪', 'J'),
  ('Arabia Saudită', 'KSA', '🇸🇦', 'J'),
  ('Ucraina', 'UKR', '🇺🇦', 'K'),
  ('Chile', 'CHI', '🇨🇱', 'K'),
  ('Egipt', 'EGY', '🇪🇬', 'K'),
  ('Paraguay', 'PAR', '🇵🇾', 'K'),
  ('România', 'ROU', '🇷🇴', 'L'),
  ('Turcia', 'TUR', '🇹🇷', 'L'),
  ('Noua Zeelandă', 'NZL', '🇳🇿', 'L'),
  ('Irlanda', 'IRL', '🇮🇪', 'L')
ON CONFLICT (name) DO NOTHING;

-- Sample group-stage matches (first round per group)
INSERT INTO public.matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue, status)
SELECT
  'group'::public.match_stage,
  t1.group_letter,
  t1.id,
  t2.id,
  v.kickoff_at,
  v.venue,
  'scheduled'::public.match_status
FROM (VALUES
  ('Brazilia', 'Maroc', '2026-06-11 20:00:00+00', 'Los Angeles'),
  ('Argentina', 'Polonia', '2026-06-12 17:00:00+00', 'Mexico City'),
  ('Franța', 'Canada', '2026-06-12 20:00:00+00', 'Toronto'),
  ('Anglia', 'SUA', '2026-06-13 19:00:00+00', 'Dallas'),
  ('Germania', 'Spania', '2026-06-13 22:00:00+00', 'New York'),
  ('Belgia', 'Uruguay', '2026-06-14 17:00:00+00', 'Miami'),
  ('Portugalia', 'Elveția', '2026-06-14 20:00:00+00', 'Boston'),
  ('Olanda', 'Senegal', '2026-06-15 18:00:00+00', 'Atlanta'),
  ('Italia', 'Columbia', '2026-06-15 21:00:00+00', 'Houston'),
  ('Cehia', 'Suedia', '2026-06-16 17:00:00+00', 'Seattle'),
  ('Ucraina', 'Egipt', '2026-06-16 20:00:00+00', 'San Francisco'),
  ('România', 'Turcia', '2026-06-17 18:00:00+00', 'Chicago')
) AS v(home_name, away_name, kickoff_at, venue)
JOIN public.teams t1 ON t1.name = v.home_name
JOIN public.teams t2 ON t2.name = v.away_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.matches m
  WHERE m.home_team_id = t1.id AND m.away_team_id = t2.id AND m.kickoff_at = v.kickoff_at
);

-- Bonus lock: 1 hour before first match
UPDATE public.tournament_settings
SET bonus_lock_at = '2026-06-11 19:00:00+00'
WHERE id = 1 AND bonus_lock_at IS NULL;
