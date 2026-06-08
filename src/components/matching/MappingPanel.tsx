import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/matching/store";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const NONE = "__none__";

/** Per-parameter, per-side column-mapping editor. */
export function MappingPanel() {
  const parameters = useAppStore((s) => s.parameters);
  const mapping = useAppStore((s) => s.mapping);
  const childDS = useAppStore((s) => s.childDS);
  const volunteerDS = useAppStore((s) => s.volunteerDS);
  const setMappingCell = useAppStore((s) => s.setMappingCell);
  const runAutoMatch = useAppStore((s) => s.runAutoMatch);

  if (!parameters.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
        עוד לא הוגדרו קריטריונים. עברו ללשונית "הגדרות" להגדרת קריטריוני שיבוץ.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">מיפוי עמודות</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            לכל קריטריון בחרו את העמודה המתאימה בקובץ הילדים ובקובץ המתנדבים. השיבוץ יחושב מחדש אוטומטית.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-right">קריטריון</th>
              <th className="px-3 py-2 text-right">עמודה — ילדים</th>
              <th className="px-3 py-2 text-right">עמודה — מתנדבים</th>
              <th className="px-3 py-2 text-right">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((p) => {
              const m = mapping[p.id] ?? {};
              const ok = !!m.childCol && !!m.volunteerCol;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">{p.name}</td>
                  <td className="px-3 py-2">
                    <ColumnSelect
                      columns={childDS.columns}
                      value={m.childCol}
                      onChange={(v) => {
                        setMappingCell(p.id, "childCol", v);
                        runAutoMatch();
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ColumnSelect
                      columns={volunteerDS.columns}
                      value={m.volunteerCol}
                      onChange={(v) => {
                        setMappingCell(p.id, "volunteerCol", v);
                        runAutoMatch();
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {ok ? (
                      <span className="inline-flex items-center gap-1 text-xs text-match-high">
                        <CheckCircle2 className="size-3.5" /> ממופה
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-match-med">
                        <AlertTriangle className="size-3.5" /> חסר מיפוי
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnSelect({
  columns,
  value,
  onChange,
}: {
  columns: string[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Select
      dir="rtl"
      value={value ?? NONE}
      onValueChange={(v) => onChange(v === NONE ? undefined : v)}
    >
      <SelectTrigger className="h-9">
        <SelectValue placeholder="בחרו עמודה…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>— ללא —</SelectItem>
        {columns.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}