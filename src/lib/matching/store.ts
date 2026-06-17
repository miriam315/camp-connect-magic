import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Assignment, Dataset, Mapping, Parameter } from "./types";
import { autoMatch, buildContext, scorePair } from "./score";
import { validateDatasets, type ValidationIssue } from "./normalize";
import { defaultMapping, defaultParameters, emptyDataset } from "./mockData";

interface AppState {
  parameters: Parameter[];
  mapping: Mapping;
  wildcards: string[];
  childDS: Dataset;
  volunteerDS: Dataset;
  assignments: Assignment[];

  // parameters
  addParameter: () => void;
  updateParameter: (id: string, patch: Partial<Parameter>) => void;
  addSynonym: (id: string, raw: string, canonical: string) => void;
  removeSynonym: (id: string, raw: string) => void;
  removeParameter: (id: string) => void;
  resetParameters: () => void;

  // wildcards
  addWildcard: (value: string) => void;
  removeWildcard: (value: string) => void;
  setWildcards: (values: string[]) => void;

  // mapping
  setMappingCell: (paramId: string, side: "childCol" | "volunteerCol", value: string | undefined) => void;

  // data
  setChildDataset: (ds: Dataset) => void;
  setVolunteerDataset: (ds: Dataset) => void;
  clearAll: () => void;

  // assignments
  runAutoMatch: () => void;
  assignManual: (childIdx: number, volunteerIdx: number) => void;
  unassignChild: (childIdx: number) => void;
  clearAssignments: () => void;

  // selectors
  validationIssues: () => ValidationIssue[];
}

const DEFAULT_WILDCARDS = [
  "לא משנה",
  "לא אכפת",
  "הכל",
  "כל אחד",
  "any",
  "n/a",
  "-",
];

const initialChild = emptyDataset();
const initialVol = emptyDataset();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      parameters: defaultParameters,
      mapping: defaultMapping,
      wildcards: DEFAULT_WILDCARDS,
      childDS: initialChild,
      volunteerDS: initialVol,
      assignments: [],

      addParameter: () =>
        set((s) => ({
          parameters: [
            ...s.parameters,
            { id: `p-${Date.now()}`, name: "קריטריון חדש", type: "categorical", weight: 5, enabled: true },
          ],
        })),

      updateParameter: (id, patch) =>
        set((s) => ({
          parameters: s.parameters.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      addSynonym: (id, raw, canonical) =>
        set((s) => ({
          parameters: s.parameters.map((p) =>
            p.id === id
              ? { ...p, synonyms: { ...(p.synonyms ?? {}), [raw.trim().toLowerCase()]: canonical.trim() } }
              : p,
          ),
        })),

      removeSynonym: (id, raw) =>
        set((s) => ({
          parameters: s.parameters.map((p) => {
            if (p.id !== id || !p.synonyms) return p;
            const { [raw]: _drop, ...rest } = p.synonyms;
            return { ...p, synonyms: rest };
          }),
        })),

      removeParameter: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.mapping;
          return {
            parameters: s.parameters.filter((p) => p.id !== id),
            mapping: rest,
          };
        }),

      resetParameters: () =>
        set({ parameters: defaultParameters, mapping: defaultMapping }),

      addWildcard: (value) =>
        set((s) => {
          const v = value.trim();
          if (!v) return s;
          const exists = s.wildcards.some((w) => w.trim().toLowerCase() === v.toLowerCase());
          if (exists) return s;
          return { wildcards: [...s.wildcards, v] };
        }),

      removeWildcard: (value) =>
        set((s) => ({
          wildcards: s.wildcards.filter((w) => w.trim().toLowerCase() !== value.trim().toLowerCase()),
        })),

      setWildcards: (values) => set({ wildcards: values }),

      setMappingCell: (paramId, side, value) =>
        set((s) => ({
          mapping: {
            ...s.mapping,
            [paramId]: { ...s.mapping[paramId], [side]: value },
          },
        })),

      setChildDataset: (ds) =>
        set((s) => ({
          childDS: ds,
          assignments: autoMatch(ds, s.volunteerDS, s.parameters, s.mapping, s.wildcards),
        })),

      setVolunteerDataset: (ds) =>
        set((s) => ({
          volunteerDS: ds,
          assignments: autoMatch(s.childDS, ds, s.parameters, s.mapping, s.wildcards),
        })),

      clearAll: () =>
        set({
          parameters: [],
          mapping: {},
          wildcards: DEFAULT_WILDCARDS,
          childDS: emptyDataset(),
          volunteerDS: emptyDataset(),
          assignments: [],
        }),

      runAutoMatch: () =>
        set((s) => ({
          assignments: autoMatch(s.childDS, s.volunteerDS, s.parameters, s.mapping, s.wildcards),
        })),

      assignManual: (childIdx, volunteerIdx) =>
        set((s) => {
          const others = s.assignments.filter(
            (a) => a.childIdx !== childIdx && a.volunteerIdx !== volunteerIdx,
          );
          const ctx = buildContext(s.parameters, s.mapping, s.childDS, s.volunteerDS, s.wildcards);
          const score = scorePair(
            s.childDS.rows[childIdx],
            s.volunteerDS.rows[volunteerIdx],
            s.parameters,
            s.mapping,
            ctx,
          );
          return { assignments: [...others, { childIdx, volunteerIdx, score }] };
        }),

      unassignChild: (childIdx) =>
        set((s) => ({ assignments: s.assignments.filter((a) => a.childIdx !== childIdx) })),

      clearAssignments: () => set({ assignments: [] }),

      validationIssues: () => {
        const s = get();
        return validateDatasets(s.parameters, s.mapping, s.childDS, s.volunteerDS, s.wildcards);
      },
    }),
    {
      name: "tsamid.matching.v6",
      version: 6,
      migrate: (persisted: any) => {
        if (!persisted) return persisted;
        if (!Array.isArray(persisted.wildcards) || persisted.wildcards.length === 0) {
          persisted.wildcards = DEFAULT_WILDCARDS;
        }
        return persisted;
      },
    },
  ),
);