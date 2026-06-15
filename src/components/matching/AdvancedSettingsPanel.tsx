import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/matching/store";
import type { Parameter } from "@/lib/matching/types";
import type { RangeBucket } from "@/lib/matching/types";

/**
 * Advanced configuration: per-parameter allowed values, synonyms, and a
 * flexible volunteer-side constraint (e.g., "no volunteer over age 9").
 * Lives in its own tab so the basic Settings panel stays simple.
 */
export function AdvancedSettingsPanel() {
  const parameters = useAppStore((s) => s.parameters);
  const runAutoMatch = useAppStore((s) => s.runAutoMatch);

  const editable = parameters.filter((p) => p.type !== "name");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">מיפוי וערכים תקניים (Advanced)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          הגדירו לכל קריטריון רשימת ערכים תקנית, מיפוי מילים נרדפות (למשל
          <span className="font-mono"> "ת. ד." → "תסמונת דאון"</span>), ואילוצים גמישים כמו
          "אין מתנדבים מעל גיל 9". המנוע יבצע נורמליזציה לפני חישוב הציון.
        </p>
      </div>

      <div className="space-y-4">
        {editable.map((p) => (
          <ParamCard key={p.id} param={p} />
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={runAutoMatch} className="gap-2">
          <Sparkles className="size-4" /> החל ושבץ מחדש
        </Button>
      </div>
    </div>
  );
}

function ParamCard({ param: p }: { param: Parameter }) {
  const updateParameter = useAppStore((s) => s.updateParameter);
  const addSynonym = useAppStore((s) => s.addSynonym);
  const removeSynonym = useAppStore((s) => s.removeSynonym);

  const [newAllowed, setNewAllowed] = useState("");
  const [synRaw, setSynRaw] = useState("");
  const [synCanonical, setSynCanonical] = useState("");

  const supportsAllowed = p.type === "categorical" || p.type === "multi";
  const supportsRanges = p.type === "range";
  const supportsConstraint = p.type === "numeric" || p.type === "gte" || p.type === "reward";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">{p.name}</h3>
        <span className="font-mono text-xs text-muted-foreground">{p.type}</span>
      </div>

      {supportsAllowed && (
        <section className="mb-5">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">ערכים תקניים</label>
          <div className="flex flex-wrap gap-1.5">
            {(p.allowedValues ?? []).map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {v}
                <button
                  aria-label="הסר"
                  onClick={() =>
                    updateParameter(p.id, {
                      allowedValues: (p.allowedValues ?? []).filter((x) => x !== v),
                    })
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={newAllowed}
              onChange={(e) => setNewAllowed(e.target.value)}
              placeholder="הוסיפו ערך תקני…"
              className="h-9 max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newAllowed.trim()) {
                  updateParameter(p.id, {
                    allowedValues: [...(p.allowedValues ?? []), newAllowed.trim()],
                  });
                  setNewAllowed("");
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!newAllowed.trim()) return;
                updateParameter(p.id, {
                  allowedValues: [...(p.allowedValues ?? []), newAllowed.trim()],
                });
                setNewAllowed("");
              }}
            >
              הוסף
            </Button>
          </div>
        </section>
      )}

      {supportsRanges && <RangesEditor param={p} />}

      {supportsAllowed && (
        <section className="mb-5">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">
            מילים נרדפות (Raw → תקני)
          </label>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(p.synonyms ?? {}).map(([raw, canonical]) => (
                  <tr key={raw} className="border-t border-border first:border-t-0">
                    <td className="px-3 py-1.5 font-mono text-xs">{raw}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">→</td>
                    <td className="px-3 py-1.5 font-medium">{canonical}</td>
                    <td className="w-10 px-2">
                      <button
                        onClick={() => removeSynonym(p.id, raw)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                        aria-label="הסר מיפוי"
                      >
                        <X className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
            <Input
              value={synRaw}
              onChange={(e) => setSynRaw(e.target.value)}
              placeholder="ערך גולמי (raw)"
              className="h-9"
            />
            <span className="text-muted-foreground">→</span>
            {p.allowedValues?.length ? (
              <Select dir="rtl" value={synCanonical} onValueChange={setSynCanonical}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="ערך תקני…" />
                </SelectTrigger>
                <SelectContent>
                  {p.allowedValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={synCanonical}
                onChange={(e) => setSynCanonical(e.target.value)}
                placeholder="ערך תקני"
                className="h-9"
              />
            )}
            <Button
              size="sm"
              className="gap-1"
              onClick={() => {
                if (!synRaw.trim() || !synCanonical.trim()) return;
                addSynonym(p.id, synRaw, synCanonical);
                setSynRaw("");
                setSynCanonical("");
              }}
            >
              <Plus className="size-4" /> הוסף
            </Button>
          </div>
        </section>
      )}

      {supportsRanges && <RangeSynonymsEditor param={p} />}

      {supportsConstraint && (
        <section>
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">
            אילוץ גמיש על צד המתנדב (אופציונלי)
          </label>
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
            <Select
              dir="rtl"
              value={p.constraint?.kind ?? "__none__"}
              onValueChange={(v) => {
                if (v === "__none__") return updateParameter(p.id, { constraint: undefined });
                updateParameter(p.id, {
                  constraint: { kind: v as "maxVolunteer" | "minVolunteer", value: p.constraint?.value ?? 0 },
                });
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— ללא —</SelectItem>
                <SelectItem value="maxVolunteer">לכל היותר (≤)</SelectItem>
                <SelectItem value="minVolunteer">לפחות (≥)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={p.constraint?.value ?? ""}
              disabled={!p.constraint}
              onChange={(e) =>
                p.constraint &&
                updateParameter(p.id, {
                  constraint: { ...p.constraint, value: Number(e.target.value) },
                })
              }
              placeholder="ערך"
              className="h-9"
            />
            {p.constraint && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateParameter(p.id, { constraint: undefined })}
              >
                בטל
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            כאשר הערך של המתנדב חורג, ציון הקריטריון הזה יאופס בלבד — שיבוץ אינו נחסם.
          </p>
        </section>
      )}
    </div>
  );
}