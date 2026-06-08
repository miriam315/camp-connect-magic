import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { Priorities } from "@/lib/matching/types";
import { defaultPriorities } from "@/lib/matching/score";

interface Props {
  priorities: Priorities;
  onChange: (p: Priorities) => void;
  onRunMatch: () => void;
}

const rows: Array<{ key: keyof Priorities; label: string; hint: string }> = [
  { key: "medical", label: "מומחיות רפואית", hint: "התאמת ניסיון המתנדב לצרכים הרפואיים של הילד" },
  { key: "language", label: "שפה משותפת", hint: "עדיפות לזוגות עם שפה משותפת" },
  { key: "geography", label: "קרבה גאוגרפית", hint: "עדיפות לזוגות מאותה עיר" },
  { key: "age", label: "התאמת גיל", hint: "פער גיל מתאים בין המתנדב לילד" },
];

export function SettingsPanel({ priorities, onChange, onRunMatch }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">עדיפויות שיבוץ</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              קבעו את משקלי האלגוריתם. ככל שהמשקל גבוה יותר, השפעת הקריטריון על ציון ההתאמה גדולה יותר.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => onChange(defaultPriorities)}>
            <RotateCcw className="size-4" /> איפוס
          </Button>
        </div>

        <div className="mt-6 space-y-7">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.hint}</p>
                </div>
                <span className="font-mono text-base font-bold text-primary tabular-nums">
                  {priorities[row.key]}
                </span>
              </div>
              <Slider
                value={[priorities[row.key]]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) => onChange({ ...priorities, [row.key]: v })}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end border-t border-border pt-4">
          <Button onClick={onRunMatch}>הפעלת שיבוץ חכם</Button>
        </div>
      </div>
    </div>
  );
}