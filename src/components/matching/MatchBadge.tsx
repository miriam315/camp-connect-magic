import { scoreTier } from "@/lib/matching/score";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  className?: string;
}

export function MatchBadge({ score, className }: Props) {
  const tier = scoreTier(score);
  const styles =
    tier === "high"
      ? "bg-match-high text-match-high-foreground"
      : tier === "med"
        ? "bg-match-med text-match-med-foreground"
        : "bg-match-low text-match-low-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums shadow-sm transition-all",
        styles,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {score}
    </span>
  );
}