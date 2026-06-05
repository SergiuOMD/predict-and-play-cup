-- Doar signup email + cod invitație (fără OAuth/Google)

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
BEGIN
  v_code := TRIM(COALESCE(
    NEW.raw_user_meta_data->>'invite_code',
    NEW.raw_user_meta_data->>'invite'
  ));
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  IF v_code IS NULL OR v_code = '' OR NOT public.validate_invite_code(v_code) THEN
    RAISE EXCEPTION 'Cod de invitatie invalid sau lipsa. Foloseste: OMDworldcup2026';
  END IF;

  UPDATE public.invite_codes
  SET uses_count = uses_count + 1
  WHERE LOWER(TRIM(code)) = LOWER(v_code);

  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, NEW.email, v_name, NEW.raw_user_meta_data->>'avatar_url');

  RETURN NEW;
END;
$$;

INSERT INTO public.invite_codes (code, note, max_uses, active)
VALUES ('OMDworldcup2026', 'Echipa OMD', NULL, true)
ON CONFLICT (code) DO UPDATE SET active = true;
