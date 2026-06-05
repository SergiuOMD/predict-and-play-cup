-- Jucători pentru selecția golgheterului

CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  position TEXT,
  nationality TEXT,
  shirt_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX players_external_id_uidx ON public.players(external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX players_team_name_uidx ON public.players(team_id, name);
CREATE INDEX players_name_idx ON public.players(name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_select" ON public.players FOR SELECT TO authenticated USING (true);
CREATE POLICY "players_admin_all" ON public.players FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
