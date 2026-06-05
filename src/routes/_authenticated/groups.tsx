import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/page-header";
import { groupAccentColor } from "@/lib/match-utils";
import { Grid3x3 } from "lucide-react";

type Team = { id: string; name: string; flag_emoji: string | null; group_letter: string | null };

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({ meta: [{ title: "Grupe · ORBICO WC2026" }] }),
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
    return (
      <>
        <PageHeader title="Grupe" icon={<Grid3x3 className="h-5 w-5 text-white" />} />
        <div className="app-card p-10 text-center text-muted-foreground">
          Echipele nu sunt încă încărcate.
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupe"
        description={`${Object.keys(grouped).length} grupe · ${teams.length} echipe`}
        icon={<Grid3x3 className="h-5 w-5 text-white" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([g, list]) => {
          const accent = groupAccentColor(g);
          return (
            <article key={g} className="app-card overflow-hidden">
              <div
                className="px-4 py-3 font-black tracking-wide text-white"
                style={{ backgroundColor: accent }}
              >
                Grupa {g}
                <span className="ml-2 text-sm font-normal opacity-80">{list.length} echipe</span>
              </div>
              <ul className="divide-y">
                {list.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                    <span className="text-xl">{t.flag_emoji ?? "🏳️"}</span>
                    <span className="text-sm font-medium">{t.name}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
