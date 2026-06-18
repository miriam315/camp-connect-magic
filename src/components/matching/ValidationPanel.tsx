import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/matching/store";
import { uniqueUnmappedByParam, validateDatasets } from "@/lib/matching/normalize";
import { toast } from "sonner";

/**
 * Health-check after upload: lists rows containing values that aren't part of
 * the canonical allowedValues list (and aren't mapped via a synonym).
 * Inline action: map a raw value to an allowed canonical value.
 */
export function ValidationPanel() {
  const parameters = useAppStore((s) => s.parameters);
  const mapping = useAppStore((s) => s.mapping);
  const childDS = useAppStore((s) => s.childDS);
  const volunteerDS = useAppStore((s) => s.volunteerDS);
  const wildcards = useAppStore((s) => s.wildcards);
  const addSynonym = useAppStore((s) => s.addSynonym);
  const runAutoMatch = useAppStore((s) => s.runAutoMatch);

  const issues = useMemo(
    () => validateDatasets(parameters, mapping, childDS, volunteerDS, wildcards),
    [parameters, mapping, childDS, volunteerDS, wildcards],
  );
  const grouped = useMemo(() => uniqueUnmappedByParam(issues), [issues]);
  const paramOptions = useMemo(
    () => Object.fromEntries(parameters.map((p) => [p.id, p])),
    [parameters],
  );

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-match-high/30 bg-match-high/10 p-4 text-sm">
        <CheckCircle2 className="size-4 text-match-high" />
        <span className="text-foreground font-medium">בדיקת תקינות עברה — כל הערכים תקניים.</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-match-med/40 bg-match-med/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-5 text-match-med" />
          <div>
            <h2 className="text-lg font-bold text-foreground">בדיקת תקינות נתונים</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              נמצאו {issues.length} שורות עם ערכים שאינם מופיעים ברשימה התקנית ואינם ממופים. מפו אותם לערך
              תקני או תקנו את הקובץ לפני הפעלת השיבוץ.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {Object.entries(grouped).map(([paramId, group]) => {
          const p = paramOptions[paramId];
          if (!p?.allowedValues?.length) return null;
          return (
            <div key={paramId} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{group.paramName}</h3>
                <span className="font-mono text-xs text-muted-foreground">{group.tokens.length} ערכים</span>
              </div>
              <div className="space-y-2">
                {group.tokens.map((raw) => (
                  <MapRow
                    key={raw}
                    raw={raw}
                    options={p.allowedValues!}
                    onMap={(canonical) => {
                      addSynonym(paramId, raw, canonical);
                      runAutoMatch();
                      toast.success(`מופה: "${raw}" → ${canonical}`);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapRow({
  raw,
  options,
  onMap,
}: {
  raw: string;
  options: string[];
  onMap: (canonical: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1.2fr_auto] items-center gap-2">
      <div className="rounded-md border border-dashed border-match-med/60 bg-background px-3 py-1.5 text-sm font-medium text-foreground">
        {raw}
      </div>
      <span className="text-muted-foreground">→</span>
      <Select dir="rtl" onValueChange={onMap}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="בחרו ערך תקני…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" disabled aria-hidden className="opacity-0 pointer-events-none">
        <Plus className="size-4" />
      </Button>
    </div>
  );
}