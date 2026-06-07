import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Download, RefreshCw, Search, Users, Baby, HeartHandshake } from "lucide-react";
import { ChildCard } from "./ChildCard";
import { VolunteerCard } from "./VolunteerCard";
import { SettingsDrawer } from "./SettingsDrawer";
import { MatchBadge } from "./MatchBadge";
import type { Assignment, Child, Priorities, Volunteer } from "@/lib/matching/types";
import { autoMatch, bestVolunteersFor, defaultPriorities, scorePair, scoreTier } from "@/lib/matching/score";
import { generateMockChildren, generateMockVolunteers } from "@/lib/matching/mockData";

const STORAGE_KEY = "tsamid.matching.v1";

interface Persisted {
  assignments: Assignment[];
  priorities: Priorities;
}

export function MatchingBoard() {
  const children = useMemo(() => generateMockChildren(), []);
  const volunteers = useMemo(() => generateMockVolunteers(), []);

  const [priorities, setPriorities] = useState<Priorities>(defaultPriorities);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [draggingVolunteer, setDraggingVolunteer] = useState<string | null>(null);
  const [dragOverChild, setDragOverChild] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p: Persisted = JSON.parse(raw);
        setAssignments(p.assignments ?? []);
        setPriorities(p.priorities ?? defaultPriorities);
      } else {
        setAssignments(autoMatch(children, volunteers, defaultPriorities));
      }
    } catch {
      setAssignments(autoMatch(children, volunteers, defaultPriorities));
    }
    setHydrated(true);
  }, [children, volunteers]);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ assignments, priorities }));
  }, [assignments, priorities, hydrated]);

  const assignmentByChild = useMemo(() => {
    const m = new Map<string, Assignment>();
    assignments.forEach((a) => m.set(a.childId, a));
    return m;
  }, [assignments]);

  const assignedVolunteerIds = useMemo(
    () => new Set(assignments.map((a) => a.volunteerId)),
    [assignments],
  );

  const selected = selectedChild ? children.find((c) => c.id === selectedChild) ?? null : null;

  const suggestionsForSelected = useMemo(() => {
    if (!selected) return [];
    const currentVol = assignmentByChild.get(selected.id)?.volunteerId;
    const exclude = new Set(assignedVolunteerIds);
    if (currentVol) exclude.delete(currentVol);
    return bestVolunteersFor(selected, volunteers, priorities, exclude, 5);
  }, [selected, assignmentByChild, assignedVolunteerIds, volunteers, priorities]);

  const handleAssign = (childId: string, volunteerId: string) => {
    const child = children.find((c) => c.id === childId)!;
    const vol = volunteers.find((v) => v.id === volunteerId)!;
    const score = scorePair(child, vol, priorities);

    // Find if volunteer is already assigned elsewhere
    const displaced = assignments.find((a) => a.volunteerId === volunteerId && a.childId !== childId);

    setAssignments((prev) => {
      const next = prev.filter((a) => a.childId !== childId && a.volunteerId !== volunteerId);
      next.push({ childId, volunteerId, score });
      return next;
    });

    if (displaced) {
      const dChild = children.find((c) => c.id === displaced.childId);
      toast.warning(`Reassigned ${vol.name}`, {
        description: `${dChild?.name ?? "Another child"} is now unassigned.`,
      });
    } else {
      toast.success(`Assigned ${vol.name} → ${child.name}`, {
        description: `Match score ${score}`,
      });
    }
  };

  const handleUnassign = (childId: string) => {
    setAssignments((prev) => prev.filter((a) => a.childId !== childId));
  };

  const runSmartMatch = () => {
    setAssignments(autoMatch(children, volunteers, priorities));
    toast.success("Smart match complete", { description: "All children paired by current priorities." });
  };

  const exportCsv = () => {
    const rows = [["Child", "Age", "City", "Volunteer", "Volunteer City", "Match Score"]];
    children.forEach((c) => {
      const a = assignmentByChild.get(c.id);
      const v = a ? volunteers.find((x) => x.id === a.volunteerId) : null;
      rows.push([c.name, String(c.age), c.city, v?.name ?? "—", v?.city ?? "—", a ? String(a.score) : "—"]);
    });
    const csv = rows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tsamid-assignments.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Schedule exported");
  };

  const stats = useMemo(() => {
    const high = assignments.filter((a) => scoreTier(a.score) === "high").length;
    const med = assignments.filter((a) => scoreTier(a.score) === "med").length;
    const low = assignments.filter((a) => scoreTier(a.score) === "low").length;
    const avg = assignments.length
      ? Math.round(assignments.reduce((s, a) => s + a.score, 0) / assignments.length)
      : 0;
    return { high, med, low, avg, total: assignments.length };
  }, [assignments]);

  const filteredChildren = children.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase()),
  );

  // Highlight: when a volunteer is dragged, show best children
  const draggingVolObj = draggingVolunteer ? volunteers.find((v) => v.id === draggingVolunteer) : null;
  const dragChildScores = useMemo(() => {
    if (!draggingVolObj) return new Map<string, number>();
    const m = new Map<string, number>();
    children.forEach((c) => m.set(c.id, scorePair(c, draggingVolObj, priorities)));
    return m;
  }, [draggingVolObj, children, priorities]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartHandshake className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight text-foreground">Tsamid Matching Board</h1>
              <p className="text-xs text-muted-foreground">Smart matching & scheduling for special-needs camps</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-4 rounded-lg border border-border bg-background px-4 py-1.5 md:flex">
              <Stat label="Pairs" value={`${stats.total}/${children.length}`} />
              <Divider />
              <Stat label="Avg" value={String(stats.avg)} mono />
              <Divider />
              <div className="flex items-center gap-1.5">
                <Dot className="bg-match-high" /> <span className="font-mono text-xs">{stats.high}</span>
                <Dot className="bg-match-med ml-1" /> <span className="font-mono text-xs">{stats.med}</span>
                <Dot className="bg-match-low ml-1" /> <span className="font-mono text-xs">{stats.low}</span>
              </div>
            </div>

            <SettingsDrawer priorities={priorities} onChange={setPriorities} />
            <Button variant="outline" size="sm" className="gap-2" onClick={runSmartMatch}>
              <Sparkles className="size-4" /> Smart Suggest
            </Button>
            <Button size="sm" className="gap-2" onClick={exportCsv}>
              <Download className="size-4" /> Export
            </Button>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_420px]">
        {/* Children column */}
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Baby className="size-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Children</h2>
              <span className="font-mono text-xs text-muted-foreground">{filteredChildren.length}</span>
            </div>
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or city…"
                className="h-9 pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredChildren.map((c) => {
              const a = assignmentByChild.get(c.id);
              const v = a ? volunteers.find((x) => x.id === a.volunteerId) : undefined;
              const dragScore = dragChildScores.get(c.id);
              const highlight = !!draggingVolObj && (dragScore ?? 0) >= 80;
              return (
                <ChildCard
                  key={c.id}
                  child={c}
                  assignedVolunteer={v}
                  score={a?.score ?? dragScore}
                  highlighted={highlight}
                  isDragOver={dragOverChild === c.id}
                  onDragOver={() => setDragOverChild(c.id)}
                  onDragLeave={() => setDragOverChild((cur) => (cur === c.id ? null : cur))}
                  onDrop={(e) => {
                    const vid = e.dataTransfer.getData("text/volunteer-id");
                    setDragOverChild(null);
                    if (vid) handleAssign(c.id, vid);
                  }}
                  onUnassign={() => handleUnassign(c.id)}
                  onSelect={() => setSelectedChild((cur) => (cur === c.id ? null : c.id))}
                  selected={selectedChild === c.id}
                />
              );
            })}
          </div>
        </section>

        {/* Volunteers column */}
        <aside className="min-w-0">
          <div className="sticky top-[88px]">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Volunteers</h2>
              <span className="font-mono text-xs text-muted-foreground">
                {volunteers.length - assignedVolunteerIds.size} available
              </span>
            </div>

            {selected && (
              <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Suggestions for {selected.name}
                  </p>
                  <button
                    onClick={() => setSelectedChild(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    clear
                  </button>
                </div>
                <div className="space-y-1.5">
                  {suggestionsForSelected.map(({ volunteer, score }) => (
                    <button
                      key={volunteer.id}
                      onClick={() => handleAssign(selected.id, volunteer.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-transparent bg-card px-3 py-2 text-left transition hover:border-primary/30 hover:bg-card"
                    >
                      <span className="text-sm font-medium text-foreground">{volunteer.name}</span>
                      <MatchBadge score={score} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-[calc(100vh-220px)] space-y-2 overflow-y-auto pr-1">
              {volunteers.map((v) => (
                <VolunteerCard
                  key={v.id}
                  volunteer={v}
                  assigned={assignedVolunteerIds.has(v.id)}
                  dragging={draggingVolunteer === v.id}
                  score={selected ? scorePair(selected, v, priorities) : undefined}
                  highlighted={
                    selected
                      ? scorePair(selected, v, priorities) >= 80 && !assignedVolunteerIds.has(v.id)
                      : false
                  }
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/volunteer-id", v.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingVolunteer(v.id);
                  }}
                  onDragEnd={() => {
                    setDraggingVolunteer(null);
                    setDragOverChild(null);
                  }}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full gap-2 text-muted-foreground"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setAssignments(autoMatch(children, volunteers, priorities));
                toast.success("Board reset");
              }}
            >
              <RefreshCw className="size-4" /> Reset board
            </Button>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
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