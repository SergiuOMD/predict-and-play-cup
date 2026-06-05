import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Team = { id: string; name: string; flag_emoji: string | null; group_letter: string | null };

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({ meta: [{ title: "Grupe · OMD WC2026" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    supabase.from("teams").select("*").order("group_letter").order("name")
      .then(({ data }) => setTeams((data ?? []) as Team[]));
  }, []);

  const grouped = teams.reduce<Record<string, Team[]>>((acc, t) => {
    const g = t.group_letter ?? "—";
    (acc[g] ??= []).push(t);
    return acc;
  }, {});

  if (teams.length === 0) {
    return <Card className="p-8 text-center"><p className="text-muted-foreground">Echipele nu sunt încă încărcate.</p></Card>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Grupe</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([g, list]) => (
          <Card key={g}>
            <CardHeader><CardTitle>Grupa {g}</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {list.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 py-1">
                    <span>{t.flag_emoji ?? "🏳️"}</span>
                    <span>{t.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
