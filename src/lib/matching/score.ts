import type {
  Parameter,
  Mapping,
  Dataset,
  Row,
  Assignment,
} from "./types";
import { normalizeOne, normalizeMulti } from "./normalize";

export function scoreTier(score: number): "high" | "med" | "low" {
  if (score >= 80) return "high";
  if (score >= 60) return "med";
  return "low";
}

const lower = (v: unknown) => String(v ?? "").trim().toLowerCase();

/** Pre-computed range per "numeric" parameter, used to normalize closeness. */
export interface ScoreContext {
  ranges: Record<string, number>; // paramId -> range (max-min) across both sides
}

export function buildContext(
  parameters: Parameter[],
  mapping: Mapping,
  childDS: Dataset,
  volunteerDS: Dataset,
): ScoreContext {
  const ranges: Record<string, number> = {};
  for (const p of parameters) {
    if (p.enabled === false) continue;
    if (p.type !== "numeric" && p.type !== "gte" && p.type !== "reward") continue;
    const m = mapping[p.id];
    if (!m) continue;
    const vals: number[] = [];
    if (m.childCol && p.type !== "reward") {
      for (const r of childDS.rows) {
        const n = Number(r[m.childCol]);
        if (Number.isFinite(n)) vals.push(n);
      }
    }
    if (m.volunteerCol) {
      for (const r of volunteerDS.rows) {
        const n = Number(r[m.volunteerCol]);
        if (Number.isFinite(n)) vals.push(n);
      }
    }
    if (vals.length) {
      ranges[p.id] = Math.max(1, Math.max(...vals) - Math.min(...vals));
    } else {
      ranges[p.id] = 1;
    }
  }
  return { ranges };
}

/** Score a single param for a (child, volunteer) pair. Returns 0..1 or null if not scoreable. */
function scoreParam(
  p: Parameter,
  child: Row,
  volunteer: Row,
  mapping: Mapping,
  ctx: ScoreContext,
): number | null {
  const m = mapping[p.id];
  if (!m) return null;

  // Flexible constraint: enforced for numeric/gte/reward types using the volunteer-side column.
  if (p.constraint && m.volunteerCol) {
    const vNum = Number(volunteer[m.volunteerCol]);
    if (Number.isFinite(vNum)) {
      if (p.constraint.kind === "maxVolunteer" && vNum > p.constraint.value) return 0;
      if (p.constraint.kind === "minVolunteer" && vNum < p.constraint.value) return 0;
    }
  }

  // Reward is volunteer-side only.
  if (p.type === "reward") {
    if (!m.volunteerCol) return null;
    const v = Number(volunteer[m.volunteerCol]);
    if (!Number.isFinite(v)) return null;
    const range = ctx.ranges[p.id] || 1;
    return Math.max(0, Math.min(1, v / range));
  }

  if (!m.childCol || !m.volunteerCol) return null;
  const cv = child[m.childCol];
  const vv = volunteer[m.volunteerCol];
  if (cv === undefined || vv === undefined || cv === "" || vv === "") return null;

  switch (p.type) {
    case "categorical":
    case "range": {
      const a = normalizeOne(p, String(cv)).toLowerCase();
      const b = normalizeOne(p, String(vv)).toLowerCase();
      return a && b && a === b ? 1 : 0;
    }
    case "multi": {
      const a = new Set(normalizeMulti(p, String(cv)).map(lower));
      const b = new Set(normalizeMulti(p, String(vv)).map(lower));
      if (a.size === 0) return 0;
      let hit = 0;
      a.forEach((x) => b.has(x) && hit++);
      return hit / a.size;
    }
    case "numeric": {
      const a = Number(cv);
      const b = Number(vv);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
      const range = ctx.ranges[p.id] || 1;
      return Math.max(0, 1 - Math.abs(a - b) / range);
    }
    case "gte": {
      const a = Number(cv); // child requirement
      const b = Number(vv); // volunteer capability
      if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
      if (b >= a) return 1;
      const range = ctx.ranges[p.id] || 1;
      return Math.max(0, 1 - (a - b) / range);
    }
    case "name":
    default:
      return null;
  }
}

export function scorePair(
  child: Row,
  volunteer: Row,
  parameters: Parameter[],
  mapping: Mapping,
  ctx: ScoreContext,
): number {
  let totalWeight = 0;
  let weighted = 0;
  for (const p of parameters) {
    if (p.type === "name") continue;
    const s = scoreParam(p, child, volunteer, mapping, ctx);
    if (s === null) continue;
    totalWeight += p.weight;
    weighted += s * p.weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weighted / totalWeight) * 100);
}

/** Per-parameter breakdown for UI tooltips/insight. */
export function scoreBreakdown(
  child: Row,
  volunteer: Row,
  parameters: Parameter[],
  mapping: Mapping,
  ctx: ScoreContext,
): Array<{ param: Parameter; value: number | null }> {
  return parameters
    .filter((p) => p.type !== "name")
    .map((p) => ({ param: p, value: scoreParam(p, child, volunteer, mapping, ctx) }));
}

/** Greedy assignment by descending pair score. */
export function autoMatch(
  childDS: Dataset,
  volunteerDS: Dataset,
  parameters: Parameter[],
  mapping: Mapping,
): Assignment[] {
  const ctx = buildContext(parameters, mapping, childDS, volunteerDS);
  const pairs: Assignment[] = [];
  for (let i = 0; i < childDS.rows.length; i++) {
    for (let j = 0; j < volunteerDS.rows.length; j++) {
      pairs.push({
        childIdx: i,
        volunteerIdx: j,
        score: scorePair(childDS.rows[i], volunteerDS.rows[j], parameters, mapping, ctx),
      });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const usedC = new Set<number>();
  const usedV = new Set<number>();
  const result: Assignment[] = [];
  for (const p of pairs) {
    if (usedC.has(p.childIdx) || usedV.has(p.volunteerIdx)) continue;
    usedC.add(p.childIdx);
    usedV.add(p.volunteerIdx);
    result.push(p);
  }
  return result;
}

export function bestVolunteersFor(
  childIdx: number,
  childDS: Dataset,
  volunteerDS: Dataset,
  parameters: Parameter[],
  mapping: Mapping,
  exclude: Set<number>,
  limit = 5,
): Array<{ volunteerIdx: number; score: number }> {
  const ctx = buildContext(parameters, mapping, childDS, volunteerDS);
  const child = childDS.rows[childIdx];
  return volunteerDS.rows
    .map((v, idx) => ({
      volunteerIdx: idx,
      score: scorePair(child, v, parameters, mapping, ctx),
    }))
    .filter((x) => !exclude.has(x.volunteerIdx))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Find the display-name column from a parameter list (the param marked as "name"). */
export function getNameColumn(parameters: Parameter[], mapping: Mapping, side: "child" | "volunteer"): string | undefined {
  const p = parameters.find((x) => x.type === "name");
  if (!p) return undefined;
  const m = mapping[p.id];
  return side === "child" ? m?.childCol : m?.volunteerCol;
}