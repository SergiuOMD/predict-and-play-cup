import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  formatDaySummary,
  openDayKeys,
  type MatchDayGroup,
  type MatchDayLike,
} from "@/lib/match-groups";
import { cn } from "@/lib/utils";

type MatchDayAccordionProps<T extends MatchDayLike> = {
  groups: MatchDayGroup<T>[];
  renderMatch: (match: T) => ReactNode;
  getMatchKey?: (match: T) => string;
  listClassName?: string;
  className?: string;
};

export function MatchDayAccordion<T extends MatchDayLike>({
  groups,
  renderMatch,
  getMatchKey,
  listClassName,
  className,
}: MatchDayAccordionProps<T>) {
  const defaultOpen = useMemo(() => openDayKeys(groups), [groups]);

  if (groups.length === 0) return null;

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpen}
      className={cn("space-y-4", className)}
    >
      {groups.map((group) => (
        <AccordionItem
          key={group.key}
          value={group.key}
          className="app-card overflow-hidden border-0"
        >
          <AccordionTrigger className="bg-gradient-hermes px-4 py-2.5 hover:no-underline sm:px-5 [&[data-state=open]>svg]:text-white">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center sm:flex-row sm:justify-between sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 sm:text-xs">
                {group.label}
              </span>
              <span className="text-[10px] font-medium normal-case tracking-normal text-white/70 sm:text-[11px]">
                {formatDaySummary(group.matches)}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div className={cn("divide-y divide-[var(--wc-light-gray)]", listClassName)}>
              {group.matches.map((match) => (
                <div key={getMatchKey?.(match) ?? (match as { id?: string }).id ?? group.key + match.kickoff_at}>
                  {renderMatch(match)}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
