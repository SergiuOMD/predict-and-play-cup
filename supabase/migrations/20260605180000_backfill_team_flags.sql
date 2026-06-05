-- Backfill flag_emoji for FIFA WC 2026 teams (by 3-letter code or name)

UPDATE public.teams SET flag_emoji = v.emoji
FROM (VALUES
  ('ALG', '🇩🇿'), ('ARG', '🇦🇷'), ('AUS', '🇦🇺'), ('AUT', '🇦🇹'),
  ('BEL', '🇧🇪'), ('BIH', '🇧🇦'), ('BRA', '🇧🇷'), ('CAN', '🇨🇦'),
  ('CPV', '🇨🇻'), ('COL', '🇨🇴'), ('COD', '🇨🇩'), ('CIV', '🇨🇮'),
  ('CRO', '🇭🇷'), ('CUW', '🇨🇼'), ('CZE', '🇨🇿'), ('ECU', '🇪🇨'),
  ('EGY', '🇪🇬'), ('ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'), ('FRA', '🇫🇷'), ('GER', '🇩🇪'),
  ('GHA', '🇬🇭'), ('HAI', '🇭🇹'), ('IRN', '🇮🇷'), ('IRQ', '🇮🇶'),
  ('JPN', '🇯🇵'), ('JOR', '🇯🇴'), ('KOR', '🇰🇷'), ('KSA', '🇸🇦'),
  ('MAR', '🇲🇦'), ('MEX', '🇲🇽'), ('NED', '🇳🇱'), ('NZL', '🇳🇿'),
  ('NOR', '🇳🇴'), ('PAN', '🇵🇦'), ('PAR', '🇵🇾'), ('POR', '🇵🇹'),
  ('QAT', '🇶🇦'), ('RSA', '🇿🇦'), ('SCO', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'), ('SEN', '🇸🇳'),
  ('ESP', '🇪🇸'), ('SWE', '🇸🇪'), ('SUI', '🇨🇭'), ('TUN', '🇹🇳'),
  ('TUR', '🇹🇷'), ('URU', '🇺🇾'), ('USA', '🇺🇸'), ('UZB', '🇺🇿')
) AS v(code, emoji)
WHERE upper(public.teams.code) = v.code
  AND (public.teams.flag_emoji IS NULL OR public.teams.flag_emoji = '');

-- Fallback by exact name (football-data / FIFA naming)
UPDATE public.teams SET flag_emoji = '🇲🇽' WHERE flag_emoji IS NULL AND name ILIKE 'Mexico';
UPDATE public.teams SET flag_emoji = '🇺🇸' WHERE flag_emoji IS NULL AND name ILIKE 'United States';
UPDATE public.teams SET flag_emoji = '🇨🇦' WHERE flag_emoji IS NULL AND name ILIKE 'Canada';
UPDATE public.teams SET flag_emoji = '🇧🇦' WHERE flag_emoji IS NULL AND name ILIKE '%Bosnia%';
UPDATE public.teams SET flag_emoji = '🇰🇷' WHERE flag_emoji IS NULL AND name ILIKE 'Korea Republic';
UPDATE public.teams SET flag_emoji = '🇮🇷' WHERE flag_emoji IS NULL AND (name ILIKE 'Iran' OR name ILIKE 'IR Iran');
UPDATE public.teams SET flag_emoji = '🇨🇿' WHERE flag_emoji IS NULL AND (name ILIKE 'Czechia' OR name ILIKE 'Czech Republic');
UPDATE public.teams SET flag_emoji = '🇨🇻' WHERE flag_emoji IS NULL AND (name ILIKE 'Cabo Verde' OR name ILIKE 'Cape Verde');
UPDATE public.teams SET flag_emoji = '🇨🇩' WHERE flag_emoji IS NULL AND name ILIKE '%Congo DR%';
UPDATE public.teams SET flag_emoji = '🇨🇮' WHERE flag_emoji IS NULL AND (name ILIKE '%Ivoire%' OR name ILIKE 'Ivory Coast');
UPDATE public.teams SET flag_emoji = '🇹🇷' WHERE flag_emoji IS NULL AND (name ILIKE 'Türkiye' OR name ILIKE 'Turkey');
UPDATE public.teams SET flag_emoji = '🇿🇦' WHERE flag_emoji IS NULL AND name ILIKE 'South Africa';
UPDATE public.teams SET flag_emoji = '🇸🇦' WHERE flag_emoji IS NULL AND name ILIKE 'Saudi Arabia';
