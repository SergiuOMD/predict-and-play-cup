-- =============================================================================
-- SETUP COMPLET pentru proiect Supabase nou
-- Rulează tot fișierul în SQL Editor (Dashboard → SQL → New query → Run)
-- =============================================================================

-- --- Pas 1: Verificare înainte (opțional, comentează dacă rulezi prima dată) ---
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- =============================================================================
-- Pas 2: SCHEMA (copiat din migrările proiectului)
-- Dacă ai rulat deja migrarea principală, sari la Pas 4 (seed).
-- =============================================================================

-- >>> Rulează separat conținutul din:
--   supabase/migrations/20260605125441_ec263f9a-d749-46ce-a25f-8f03d99dbf97.sql
--   supabase/migrations/20260605125453_300fb33d-3329-4061-9f75-3717956826be.sql
--   supabase/migrations/20260605140000_football_data_external_ids.sql
-- (Fișierele sunt prea mari pentru un singur paste sigur — rulează-le în ordine.)

-- =============================================================================
-- Pas 4: SEED — cod invitație (OBLIGATORIU pentru signup)
-- =============================================================================

INSERT INTO public.invite_codes (code, note, max_uses, active)
VALUES ('OMDworldcup2026', 'Echipa OMD', NULL, true)
ON CONFLICT (code) DO UPDATE SET active = true, max_uses = EXCLUDED.max_uses;

-- =============================================================================
-- Pas 5: Admin — înlocuiește emailul
-- =============================================================================

-- INSERT INTO public.admins (email) VALUES ('tu@company.com')
-- ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- Pas 6: Fix validare cod (case-insensitive)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_invite_code(_code TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.invite_codes
    WHERE LOWER(TRIM(code)) = LOWER(TRIM(_code))
      AND active = true
      AND (max_uses IS NULL OR uses_count < max_uses)
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
  v_name TEXT;
  v_provider TEXT;
BEGIN
  v_code := TRIM(NEW.raw_user_meta_data->>'invite_code');
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  IF v_provider = 'email' THEN
    IF v_code IS NULL OR v_code = '' OR NOT public.validate_invite_code(v_code) THEN
      RAISE EXCEPTION 'Cod de invitatie invalid sau lipsa. Foloseste: OMDworldcup2026';
    END IF;
    UPDATE public.invite_codes
    SET uses_count = uses_count + 1
    WHERE LOWER(TRIM(code)) = LOWER(v_code);
  END IF;

  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, NEW.email, v_name, NEW.raw_user_meta_data->>'avatar_url');

  RETURN NEW;
END;
$$;

-- =============================================================================
-- Pas 7: VERIFICARE — toate trebuie OK înainte de signup în app
-- =============================================================================

SELECT 'profiles' AS check_item,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') AS ok
UNION ALL
SELECT 'invite_codes',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invite_codes')
UNION ALL
SELECT 'trigger on_auth_user_created',
  EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE t.tgname = 'on_auth_user_created' AND n.nspname = 'auth' AND c.relname = 'users')
UNION ALL
SELECT 'validate_invite_code(OMDworldcup2026)',
  public.validate_invite_code('OMDworldcup2026');

SELECT code, active, uses_count, max_uses FROM public.invite_codes;
