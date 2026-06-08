import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/matching/store";
import type { ParamType } from "@/lib/matching/types";

const typeLabels: Record<ParamType, string> = {
  name: "שם להצגה",
  categorical: "התאמה מדויקת",
  multi: "רשימה (חיתוך)",
  numeric: "קרבה מספרית",
  gte: "מתנדב ≥ ילד (כשירות)",
};

const typeHints: Record<ParamType, string> = {
  name: "ערך טקסטואלי המשמש להצגת שורה (אינו משפיע על הציון).",
  categorical: "ציון מלא כאשר הערכים זהים, אחרת אפס.",
  multi: "ערכים מופרדים בפסיק/נקודה־פסיק. הציון לפי גודל החיתוך.",
  numeric: "ערכים מספריים — ככל שההפרש קטן יותר, הציון גבוה יותר.",
  gte: "מתאים לכשירויות (למשל רמה רפואית): המתנדב צריך לעמוד או לעלות על דרישת הילד.",
};

export function SettingsPanel() {
  const parameters = useAppStore((s) => s.parameters);
  const { addParameter, updateParameter, removeParameter, resetParameters, runAutoMatch } =
    useAppStore();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">קריטריוני שיבוץ</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              הגדירו את הקריטריונים שלכם להתאמה. לכל קריטריון – שם, סוג, ומשקל (1–10) הקובע את חשיבותו באלגוריתם.
              לאחר ההגדרה יש למפות כל קריטריון לעמודה בקובץ הילדים והמתנדבים (לשונית "טעינת נתונים").
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="gap-2" onClick={resetParameters}>
              <RotateCcw className="size-4" /> איפוס
            </Button>
            <Button size="sm" className="gap-2" onClick={addParameter}>
              <Plus className="size-4" /> הוסף קריטריון
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {parameters.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-background p-4">
              <div className="grid gap-3 md:grid-cols-[1.4fr_1.4fr_1fr_auto] md:items-end">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">שם הקריטריון</label>
                  <Input
                    value={p.name}
                    onChange={(e) => updateParameter(p.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">סוג</label>
                  <Select
                    value={p.type}
                    onValueChange={(v) => updateParameter(p.id, { type: v as ParamType })}
                    dir="rtl"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(typeLabels) as ParamType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {typeLabels[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">משקל</label>
                    <span className="font-mono text-sm font-bold text-primary tabular-nums">
                      {p.type === "name" ? "—" : p.weight}
                    </span>
                  </div>
                  <Slider
                    value={[p.weight]}
                    min={1}
                    max={10}
                    step={1}
                    disabled={p.type === "name"}
                    onValueChange={([v]) => updateParameter(p.id, { weight: v })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParameter(p.id)}
                  aria-label="מחק קריטריון"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{typeHints[p.type]}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <Button onClick={runAutoMatch}>הפעלת שיבוץ חכם</Button>
        </div>
      </div>
    </div>
  );
}