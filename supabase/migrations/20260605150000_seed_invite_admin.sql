-- Date inițiale necesare pentru signup (cod invitație + admin)

INSERT INTO public.invite_codes (code, note, max_uses, active)
VALUES ('OMDworldcup2026', 'Echipa OMD', NULL, true)
ON CONFLICT (code) DO UPDATE SET active = true;

-- Înlocuiește emailul de mai jos cu al tău înainte de a rula, sau rulează manual în SQL Editor:
-- INSERT INTO public.admins (email) VALUES ('tu@company.com') ON CONFLICT (email) DO NOTHING;
