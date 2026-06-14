import type { Dataset, Mapping, Parameter, Row } from "./types";

const splitMulti = (v: unknown) =>
  String(v ?? "")
    .split(/[,،\/|;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Apply synonyms map (case-insensitive) to a raw value, returning canonical form. */
export function normalizeOne(p: Parameter, raw: string): string {
  const key = raw.trim().toLowerCase();
  if (!key) return "";
  const canonical = p.synonyms?.[key];
  return canonical ?? raw.trim();
}

/** For multi-valued fields: split, normalize each token. */
export function normalizeMulti(p: Parameter, raw: string): string[] {
  return splitMulti(raw).map((t) => normalizeOne(p, t));
}

export interface ValidationIssue {
  side: "child" | "volunteer";
  rowIdx: number;
  paramId: string;
  paramName: string;
  column: string;
  rawValue: string;
  unmappedTokens: string[];
}

/**
 * Pre-flight validation: for every parameter that has an `allowedValues` list,
 * scan rows on both sides and report values that aren't in the canonical list
 * (and aren't mapped by a synonym).
 */
export function validateDatasets(
  parameters: Parameter[],
  mapping: Mapping,
  childDS: Dataset,
  volunteerDS: Dataset,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const p of parameters) {
    if (!p.allowedValues?.length) continue;
    if (p.type === "name" || p.type === "numeric" || p.type === "gte" || p.type === "reward") continue;
    const allowed = new Set(p.allowedValues.map((s) => s.trim().toLowerCase()));
    const m = mapping[p.id];
    const scan = (side: "child" | "volunteer", ds: Dataset, col?: string) => {
      if (!col) return;
      ds.rows.forEach((r: Row, idx: number) => {
        const raw = String(r[col] ?? "").trim();
        if (!raw) return;
        const tokens = p.type === "multi" ? normalizeMulti(p, raw) : [normalizeOne(p, raw)];
        const bad = tokens.filter((t) => t && !allowed.has(t.toLowerCase()));
        if (bad.length) {
          issues.push({
            side,
            rowIdx: idx,
            paramId: p.id,
            paramName: p.name,
            column: col,
            rawValue: raw,
            unmappedTokens: bad,
          });
        }
      });
    };
    scan("child", childDS, m?.childCol);
    scan("volunteer", volunteerDS, m?.volunteerCol);
  }
  return issues;
}

/** Unique unmapped tokens grouped by parameter, for quick synonym mapping. */
export function uniqueUnmappedByParam(
  issues: ValidationIssue[],
): Record<string, { paramName: string; tokens: string[] }> {
  const out: Record<string, { paramName: string; tokens: Set<string> }> = {};
  for (const i of issues) {
    if (!out[i.paramId]) out[i.paramId] = { paramName: i.paramName, tokens: new Set() };
    i.unmappedTokens.forEach((t) => out[i.paramId].tokens.add(t));
  }
  return Object.fromEntries(
    Object.entries(out).map(([k, v]) => [k, { paramName: v.paramName, tokens: [...v.tokens] }]),
  );
}