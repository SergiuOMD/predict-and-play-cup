import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MatchStatus = "open" | "locked" | "finished" | "live";

type MatchStatusBadgeProps = {
  status: MatchStatus;
  score?: string;
  className?: string;
};

const STYLES: Record<MatchStatus, string> = {
  open: "border-[var(--wc-green)]/30 bg-[#e8f5e8] text-[#2d7a2c]",
  locked: "border-[var(--wc-red)]/30 bg-[#fde8e9] text-[var(--wc-red)]",
  finished: "border-[var(--wc-hermes)]/30 bg-[#e8ebf8] text-[var(--wc-hermes)]",
  live: "border-[var(--wc-red)]/40 bg-[var(--wc-red)] text-white animate-pulse",
};

const LABELS: Record<MatchStatus, string> = {
  open: "Deschis",
  locked: "Blocat",
  finished: "Final",
  live: "Live",
};

export function MatchStatusBadge({ status, score, className }: MatchStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-semibold", STYLES[status], className)}>
      {status === "finished" && score ? `Final ${score}` : LABELS[status]}
    </Badge>
  );
}
