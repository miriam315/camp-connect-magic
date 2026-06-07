import type { Child, Volunteer } from "@/lib/matching/types";
import { MatchBadge } from "./MatchBadge";
import { MapPin, Languages, Stethoscope, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  child: Child;
  assignedVolunteer?: Volunteer;
  score?: number;
  highlighted?: boolean;
  isDragOver?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onUnassign?: () => void;
  onSelect?: () => void;
  selected?: boolean;
}

const medColors: Record<string, string> = {
  none: "text-muted-foreground",
  low: "text-match-high",
  medium: "text-match-med",
  high: "text-match-low",
};

export function ChildCard({
  child,
  assignedVolunteer,
  score,
  highlighted,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onUnassign,
  onSelect,
  selected,
}: Props) {
  return (
    <div
      onClick={onSelect}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-all",
        "hover:border-primary/40 hover:shadow-md",
        highlighted && "ring-2 ring-match-high/60 shadow-md -translate-y-0.5",
        isDragOver && "border-primary ring-2 ring-primary/40 bg-primary/5",
        selected && "border-primary ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
              {child.age}
            </span>
            <h3 className="truncate font-semibold text-foreground">{child.name}</h3>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{child.city}</span>
            <span className="inline-flex items-center gap-1"><Languages className="size-3" />{child.language}</span>
            <span className={cn("inline-flex items-center gap-1 font-medium", medColors[child.medicalLevel])}>
              <Stethoscope className="size-3" />{child.medicalLevel}
            </span>
          </div>
        </div>
        {score !== undefined && <MatchBadge score={score} />}
      </div>

      <p className="mt-3 line-clamp-1 text-xs italic text-muted-foreground">{child.notes}</p>

      <div className="mt-3 border-t border-dashed border-border pt-3">
        {assignedVolunteer ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Assigned</p>
              <p className="truncate text-sm font-medium text-foreground">{assignedVolunteer.name}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnassign?.();
              }}
              className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-destructive group-hover:opacity-100"
              aria-label="Unassign"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Drag a volunteer here, or click to see suggestions.
          </p>
        )}
      </div>
    </div>
  );
}