import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Columns3,
  FileSpreadsheet,
  FileText,
  HeartHandshake,
  LayoutGrid,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/matching/store";
import { SettingsPanel } from "./SettingsPanel";
import { UploadPanel } from "./UploadPanel";
import { AdvancedSettingsPanel } from "./AdvancedSettingsPanel";
import { MatchBadge } from "./MatchBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  bestVolunteersFor,
  buildContext,
  getNameColumn,
  scorePair,
  scoreBreakdown,
  scoreTier,
} from "@/lib/matching/score";
import { cn } from "@/lib/utils";

export function MatchingBoard() {
  const parameters = useAppStore((s) => s.parameters);
  const mapping = useAppStore((s) => s.mapping);
  const childDS = useAppStore((s) => s.childDS);
  const volunteerDS = useAppStore((s) => s.volunteerDS);
  const assignments = useAppStore((s) => s.assignments);
  const runAutoMatch = useAppStore((s) => s.runAutoMatch);
  const assignManual = useAppStore((s) => s.assignManual);
  const unassignChild = useAppStore((s) => s.unassignChild);

  const [tab, setTab] = useState("board");
  const [search, setSearch] = useState("");
  const [draggingVolIdx, setDraggingVolIdx] = useState<number | null>(null);
  const [dragOverChildIdx, setDragOverChildIdx] = useState<number | null>(null);
  const [selectedChildIdx, setSelectedChildIdx] = useState<number | null>(null);

  const ctx = useMemo(
    () => buildContext(parameters, mapping, childDS, volunteerDS),
    [parameters, mapping, childDS, volunteerDS],
  );

  const childNameCol = getNameColumn(parameters, mapping, "child");
  const volNameCol = getNameColumn(parameters, mapping, "volunteer");
  const childName = (i: number) =>
    (childNameCol && childDS.rows[i]?.[childNameCol]) || `שורה ${i + 1}`;
  const volName = (i: number) =>
    (volNameCol && volunteerDS.rows[i]?.[volNameCol]) || `שורה ${i + 1}`;

  const assignmentByChild = useMemo(() => {
    const m = new Map<number, { volunteerIdx: number; score: number }>();
    assignments.forEach((a) => m.set(a.childIdx, { volunteerIdx: a.volunteerIdx, score: a.score }));
    return m;
  }, [assignments]);

  const assignedVolIdxs = useMemo(
    () => new Set(assignments.map((a) => a.volunteerIdx)),
    [assignments],
  );

  const stats = useMemo(() => {
    const high = assignments.filter((a) => scoreTier(a.score) === "high").length;
    const med = assignments.filter((a) => scoreTier(a.score) === "med").length;
    const low = assignments.filter((a) => scoreTier(a.score) === "low").length;
    const avg = assignments.length
      ? Math.round(assignments.reduce((s, a) => s + a.score, 0) / assignments.length)
      : 0;
    return { high, med, low, avg, total: assignments.length };
  }, [assignments]);

  const filteredChildIdxs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return childDS.rows
      .map((_, i) => i)
      .filter((i) => {
        if (!q) return true;
        return Object.values(childDS.rows[i]).some((v) =>
          String(v ?? "").toLowerCase().includes(q),
        );
      });
  }, [childDS.rows, search]);

  const handleAssign = (childIdx: number, volunteerIdx: number) => {
    assignManual(childIdx, volunteerIdx);
    toast.success(`שובץ: ${volName(volunteerIdx)} → ${childName(childIdx)}`);
  };

  const handleRunMatch = () => {
    runAutoMatch();
    toast.success("השיבוץ החכם הושלם");
  };

  // ---- Dynamic table columns + export columns ----
  type ExtraCol = { key: string; label: string; side: "child" | "volunteer"; paramId: string };
  const extraColumns: ExtraCol[] = useMemo(() => {
    const list: ExtraCol[] = [];
    parameters.forEach((p) => {
      if (p.type === "name") return;
      list.push({ key: `c:${p.id}`, label: `ילד · ${p.name}`, side: "child", paramId: p.id });
      list.push({ key: `v:${p.id}`, label: `מתנדב · ${p.name}`, side: "volunteer", paramId: p.id });
    });
    return list;
  }, [parameters]);

  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set());
  const toggleCol = (k: string) =>
    setVisibleCols((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  const shownExtras = extraColumns.filter((c) => visibleCols.has(c.key));

  const valueFor = (c: ExtraCol, i: number) => {
    if (c.side === "child") {
      const col = mapping[c.paramId]?.childCol;
      return col ? String(childDS.rows[i]?.[col] ?? "") : "";
    }
    const a = assignmentByChild.get(i);
    if (!a) return "";
    const col = mapping[c.paramId]?.volunteerCol;
    return col ? String(volunteerDS.rows[a.volunteerIdx]?.[col] ?? "") : "";
  };

  const buildExportRows = () => {
    const header = ["ילד", ...shownExtras.map((c) => c.label), "מתנדב משובץ", "ציון התאמה"];
    const body = filteredChildIdxs.map((i) => {
      const a = assignmentByChild.get(i);
      return [
        childName(i),
        ...shownExtras.map((c) => valueFor(c, i)),
        a ? volName(a.volunteerIdx) : "—",
        a ? String(a.score) : "—",
      ];
    });
    return [header, ...body];
  };

  const exportExcel = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, "שיבוצים");
    XLSX.writeFile(wb, "שיבוצים.xlsx");
    toast.success("הקובץ יוצא לאקסל");
  };

  const exportPdf = () => {
    const rows = buildExportRows();
    const [head, ...body] = rows;
    const esc = (s: string) =>
      s.replace(/[&<>"]/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
      );
    const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"/>
<title>שיבוצים</title>
<style>
  body { font-family: -apple-system, "Segoe UI", "Arial Hebrew", Arial, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 12px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; }
  thead { background: #f3f4f6; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>שיבוצים — ${new Date().toLocaleDateString("he-IL")}</h1>
<table>
  <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
  <tbody>${body
    .map((r) => `<tr>${r.map((v) => `<td>${esc(String(v))}</td>`).join("")}</tr>`)
    .join("")}</tbody>
</table>
<script>window.onload=()=>{setTimeout(()=>{window.print();},250);};</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("חלון הדפסה נחסם — אפשרו חלונות קופצים");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    toast.success("נפתח חלון הדפסה — שמרו כ-PDF");
  };

  const suggestions = useMemo(() => {
    if (selectedChildIdx === null) return [];
    const exclude = new Set(assignedVolIdxs);
    const cur = assignmentByChild.get(selectedChildIdx)?.volunteerIdx;
    if (cur !== undefined) exclude.delete(cur);
    return bestVolunteersFor(selectedChildIdx, childDS, volunteerDS, parameters, mapping, exclude, 5);
  }, [selectedChildIdx, assignedVolIdxs, assignmentByChild, childDS, volunteerDS, parameters, mapping]);

  const dragScoreByChild = useMemo(() => {
    const m = new Map<number, number>();
    if (draggingVolIdx === null) return m;
    const v = volunteerDS.rows[draggingVolIdx];
    childDS.rows.forEach((c, i) => {
      m.set(i, scorePair(c, v, parameters, mapping, ctx));
    });
    return m;
  }, [draggingVolIdx, childDS.rows, volunteerDS.rows, parameters, mapping, ctx]);

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-foreground">לוח שיבוצים — צמיד</h1>
              <p className="text-xs text-muted-foreground">
                מנוע שיבוץ דינמי לקריטריונים מותאמים אישית
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-4 rounded-lg border border-border bg-background px-4 py-1.5 md:flex">
              <Stat label="זוגות" value={`${stats.total}/${childDS.rows.length}`} />
              <Divider />
              <Stat label="ממוצע" value={String(stats.avg)} mono />
              <Divider />
              <div className="flex items-center gap-1.5">
                <Dot className="bg-match-high" /> <span className="font-mono text-xs">{stats.high}</span>
                <Dot className="bg-match-med mr-1" /> <span className="font-mono text-xs">{stats.med}</span>
                <Dot className="bg-match-low mr-1" /> <span className="font-mono text-xs">{stats.low}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRunMatch}>
              <Sparkles className="size-4" /> שיבוץ חכם
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={exportExcel}>
              <FileSpreadsheet className="size-4" /> ייצוא לאקסל
            </Button>
            <Button size="sm" className="gap-2" onClick={exportPdf}>
              <FileText className="size-4" /> ייצוא PDF
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="mx-auto w-full max-w-[1600px] flex-1 px-6 py-6">
        <TabsList className="mb-6">
          <TabsTrigger value="board" className="gap-2"><LayoutGrid className="size-4" /> לוח שיבוצים</TabsTrigger>
          <TabsTrigger value="upload" className="gap-2"><Upload className="size-4" /> טעינת נתונים</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><Settings2 className="size-4" /> הגדרות</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2"><SlidersHorizontal className="size-4" /> מתקדם</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>

        <TabsContent value="upload">
          <UploadPanel />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedSettingsPanel />
        </TabsContent>

        <TabsContent value="board">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <section className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-wider text-foreground">תוצאות השיבוץ</h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    {filteredChildIdxs.length}/{childDS.rows.length}
                  </span>
                </div>
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="חיפוש בכל העמודות…"
                    className="h-9 pr-9"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-right">ילד</th>
                      <th className="px-3 py-2 text-right">מתנדב משובץ</th>
                      <th className="px-3 py-2 text-right">ציון התאמה</th>
                      <th className="px-3 py-2 text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChildIdxs.map((i) => {
                      const a = assignmentByChild.get(i);
                      const dragScore = dragScoreByChild.get(i);
                      const showDrag = draggingVolIdx !== null && dragScore !== undefined;
                      const isSelected = selectedChildIdx === i;
                      const isDragOver = dragOverChildIdx === i;
                      return (
                        <tr
                          key={i}
                          onClick={() => setSelectedChildIdx((cur) => (cur === i ? null : i))}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverChildIdx(i);
                          }}
                          onDragLeave={() =>
                            setDragOverChildIdx((cur) => (cur === i ? null : cur))
                          }
                          onDrop={(e) => {
                            const raw = e.dataTransfer.getData("text/volunteer-idx");
                            setDragOverChildIdx(null);
                            if (raw !== "") handleAssign(i, Number(raw));
                          }}
                          className={cn(
                            "cursor-pointer border-t border-border transition-colors",
                            isSelected && "bg-primary/5",
                            isDragOver && "bg-primary/10 outline outline-2 outline-primary",
                            showDrag && (dragScore ?? 0) >= 80 && "bg-match-high/10",
                          )}
                        >
                          <td className="px-3 py-2 font-medium text-foreground">
                            {childName(i)}
                          </td>
                          <td className="px-3 py-2">
                            {a ? (
                              <span className="text-foreground">{volName(a.volunteerIdx)}</span>
                            ) : (
                              <span className="text-muted-foreground">— גררו מתנדב לכאן —</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {a ? (
                              <ScoreCell
                                childIdx={i}
                                volunteerIdx={a.volunteerIdx}
                                score={a.score}
                              />
                            ) : showDrag ? (
                              <MatchBadge score={dragScore!} className="opacity-70" />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {a && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unassignChild(i);
                                }}
                                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-destructive"
                                aria-label="בטל שיבוץ"
                              >
                                <X className="size-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredChildIdxs.length && (
                      <tr>
                        <td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">
                          לא נמצאו תוצאות.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="min-w-0">
              <div className="sticky top-[88px]">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-wider text-foreground">מתנדבים</h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    {volunteerDS.rows.length - assignedVolIdxs.size} זמינים
                  </span>
                </div>

                {selectedChildIdx !== null && (
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold tracking-wider text-primary">
                        הצעות עבור {childName(selectedChildIdx)}
                      </p>
                      <button
                        onClick={() => setSelectedChildIdx(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        נקה
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {suggestions.map(({ volunteerIdx, score }) => (
                        <button
                          key={volunteerIdx}
                          onClick={() => handleAssign(selectedChildIdx, volunteerIdx)}
                          className="flex w-full items-center justify-between rounded-lg border border-transparent bg-card px-3 py-2 text-right transition hover:border-primary/30"
                        >
                          <span className="text-sm font-medium text-foreground">{volName(volunteerIdx)}</span>
                          <MatchBadge score={score} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto pl-1">
                  {volunteerDS.rows.map((_, vi) => {
                    const assigned = assignedVolIdxs.has(vi);
                    const showHint =
                      selectedChildIdx !== null
                        ? scorePair(
                            childDS.rows[selectedChildIdx],
                            volunteerDS.rows[vi],
                            parameters,
                            mapping,
                            ctx,
                          )
                        : undefined;
                    return (
                      <div
                        key={vi}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/volunteer-idx", String(vi));
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingVolIdx(vi);
                        }}
                        onDragEnd={() => {
                          setDraggingVolIdx(null);
                          setDragOverChildIdx(null);
                        }}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing",
                          "hover:border-primary/40 hover:shadow-md",
                          assigned && "opacity-50",
                          draggingVolIdx === vi && "opacity-40 scale-95",
                        )}
                      >
                        <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-[11px] font-semibold">
                          {String(volName(vi)).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="truncate text-sm font-semibold text-foreground">{volName(vi)}</h4>
                            {showHint !== undefined && <MatchBadge score={showHint} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full gap-2 text-muted-foreground"
                  onClick={handleRunMatch}
                >
                  <RefreshCw className="size-4" /> חישוב שיבוץ חכם מחדש
                </Button>
              </div>
            </aside>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold text-foreground ${mono ? "font-mono tabular-nums" : ""}`}>{value}</span>
    </div>
  );
}
function Divider() {
  return <span className="h-4 w-px bg-border" />;
}
function Dot({ className }: { className?: string }) {
  return <span className={`size-2 rounded-full ${className ?? ""}`} />;
}

function ScoreCell({
  childIdx,
  volunteerIdx,
  score,
}: {
  childIdx: number;
  volunteerIdx: number;
  score: number;
}) {
  const parameters = useAppStore((s) => s.parameters);
  const mapping = useAppStore((s) => s.mapping);
  const childDS = useAppStore((s) => s.childDS);
  const volunteerDS = useAppStore((s) => s.volunteerDS);
  const ctx = useMemo(
    () => buildContext(parameters, mapping, childDS, volunteerDS),
    [parameters, mapping, childDS, volunteerDS],
  );
  const breakdown = scoreBreakdown(
    childDS.rows[childIdx],
    volunteerDS.rows[volunteerIdx],
    parameters,
    mapping,
    ctx,
  );
  const contributing = breakdown.filter((b) => b.value !== null && b.value > 0);
  const top = [...contributing].sort((a, b) => (b.value! - a.value!)).slice(0, 4);

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="cursor-help"
          onClick={(e) => e.stopPropagation()}
          aria-label="הסבר ציון התאמה"
        >
          <MatchBadge score={score} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" side="top" className="w-72" dir="rtl">
        <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground">בסיס ההתאמה</p>
        {top.length === 0 ? (
          <p className="text-xs text-muted-foreground">לא נמצאו קריטריונים חופפים.</p>
        ) : (
          <ul className="space-y-1.5">
            {top.map(({ param, value }) => (
              <li key={param.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-foreground">{param.name}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {Math.round((value ?? 0) * 100)}% · משקל {param.weight}
                </span>
              </li>
            ))}
          </ul>
        )}
        {breakdown.some((b) => b.value === 0) && (
          <p className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
            קריטריונים שלא חפפו: {breakdown.filter((b) => b.value === 0).map((b) => b.param.name).join(", ")}
          </p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}