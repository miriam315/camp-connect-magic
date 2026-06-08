import type { Volunteer } from "@/lib/matching/types";
import { MatchBadge } from "./MatchBadge";
import { MapPin, Languages, ShieldCheck, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  volunteer: Volunteer;
  assigned?: boolean;
  score?: number;
  highlighted?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
}

export function VolunteerCard({
  volunteer,
  assigned,
  score,
  highlighted,
  onDragStart,
  onDragEnd,
  dragging,
}: Props) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing",
        "hover:border-primary/40 hover:shadow-md",
        assigned && "opacity-50",
        highlighted && "ring-2 ring-match-high/60 -translate-y-0.5 shadow-md",
        dragging && "opacity-40 scale-95",
      )}
    >
      <GripVertical className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-xs font-semibold">
        {volunteer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate text-sm font-semibold text-foreground">{volunteer.name}</h4>
          {score !== undefined && <MatchBadge score={score} />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          <span className="font-mono">גיל {volunteer.age}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{volunteer.city}</span>
          <span className="inline-flex items-center gap-1"><Languages className="size-3" />{volunteer.languages.join(" / ")}</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3" />רפואי: {medLabel(volunteer.medicalExperience)}</span>
        </div>
      </div>
    </div>
  );
}

function medLabel(m: string) {
  return ({ none: "אין", low: "נמוך", medium: "בינוני", high: "גבוה" } as Record<string, string>)[m] ?? m;
}