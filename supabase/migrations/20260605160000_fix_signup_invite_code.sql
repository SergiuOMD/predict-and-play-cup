-- Signup 500 fix: validare cod invitație case-insensitive + mesaj clar

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

INSERT INTO public.invite_codes (code, note, max_uses, active)
VALUES ('OMDworldcup2026', 'Echipa OMD', NULL, true)
ON CONFLICT (code) DO UPDATE SET active = true;
