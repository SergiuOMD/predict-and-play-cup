import type { ReactNode } from "react";
import { useMemo } from "react";
import { MatchDayAccordion } from "@/components/app/match-day-accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupMatchesByDay, type MatchDayLike } from "@/lib/match-groups";
import { partitionMatchesByPhase } from "@/lib/match-stage";
import { cn } from "@/lib/utils";

type MatchPhaseTabsProps<T extends MatchDayLike & { stage: string }> = {
  matches: T[];
  renderMatch: (match: T) => ReactNode;
  getMatchKey?: (match: T) => string;
  listClassName?: string;
  accordionClassName?: string;
  emptyGroupMessage?: string;
  emptyKnockoutMessage?: string;
  className?: string;
};

function PhaseContent<T extends MatchDayLike>({
  groups,
  renderMatch,
  getMatchKey,
  listClassName,
  accordionClassName,
  emptyMessage,
}: {
  groups: ReturnType<typeof groupMatchesByDay<T>>;
  renderMatch: (match: T) => ReactNode;
  getMatchKey?: (match: T) => string;
  listClassName?: string;
  accordionClassName?: string;
  emptyMessage: string;
}) {
  if (groups.length === 0) {
    return (
      <div className="app-card p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <MatchDayAccordion
      groups={groups}
      renderMatch={renderMatch}
      getMatchKey={getMatchKey}
      listClassName={listClassName}
      className={accordionClassName}
    />
  );
}

export function MatchPhaseTabs<T extends MatchDayLike & { stage: string }>({
  matches,
  renderMatch,
  getMatchKey,
  listClassName,
  accordionClassName,
  emptyGroupMessage = "Niciun meci de grupă programat.",
  emptyKnockoutMessage = "Niciun meci de play-off programat.",
  className,
}: MatchPhaseTabsProps<T>) {
  const { group, knockout } = useMemo(() => partitionMatchesByPhase(matches), [matches]);
  const groupDays = useMemo(() => groupMatchesByDay(group), [group]);
  const knockoutDays = useMemo(() => groupMatchesByDay(knockout), [knockout]);
  const defaultTab = group.length > 0 ? "group" : "knockout";

  return (
    <Tabs defaultValue={defaultTab} className={cn("space-y-4", className)}>
      <TabsList className="grid h-11 w-full grid-cols-2 p-1">
        <TabsTrigger value="group" className="text-sm font-semibold">
          Grupe
          <span className="ml-1.5 tabular-nums text-muted-foreground">({group.length})</span>
        </TabsTrigger>
        <TabsTrigger value="knockout" className="text-sm font-semibold">
          Play-off
          <span className="ml-1.5 tabular-nums text-muted-foreground">({knockout.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="group" className="mt-4">
        <PhaseContent
          groups={groupDays}
          renderMatch={renderMatch}
          getMatchKey={getMatchKey}
          listClassName={listClassName}
          accordionClassName={accordionClassName}
          emptyMessage={emptyGroupMessage}
        />
      </TabsContent>

      <TabsContent value="knockout" className="mt-4">
        <PhaseContent
          groups={knockoutDays}
          renderMatch={renderMatch}
          getMatchKey={getMatchKey}
          listClassName={listClassName}
          accordionClassName={accordionClassName}
          emptyMessage={emptyKnockoutMessage}
        />
      </TabsContent>
    </Tabs>
  );
}
