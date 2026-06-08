import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Assignment, Dataset, Mapping, Parameter } from "./types";
import { autoMatch, buildContext, scorePair } from "./score";
import {
  defaultMapping,
  defaultParameters,
  generateMockChildren,
  generateMockVolunteers,
} from "./mockData";

interface AppState {
  parameters: Parameter[];
  mapping: Mapping;
  childDS: Dataset;
  volunteerDS: Dataset;
  assignments: Assignment[];

  // parameters
  addParameter: () => void;
  updateParameter: (id: string, patch: Partial<Parameter>) => void;
  removeParameter: (id: string) => void;
  resetParameters: () => void;

  // mapping
  setMappingCell: (paramId: string, side: "childCol" | "volunteerCol", value: string | undefined) => void;

  // data
  setChildDataset: (ds: Dataset) => void;
  setVolunteerDataset: (ds: Dataset) => void;
  loadMockData: () => void;

  // assignments
  runAutoMatch: () => void;
  assignManual: (childIdx: number, volunteerIdx: number) => void;
  unassignChild: (childIdx: number) => void;
  clearAssignments: () => void;
}

const initialChild = generateMockChildren();
const initialVol = generateMockVolunteers();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      parameters: defaultParameters,
      mapping: defaultMapping,
      childDS: initialChild,
      volunteerDS: initialVol,
      assignments: autoMatch(initialChild, initialVol, defaultParameters, defaultMapping),

      addParameter: () =>
        set((s) => ({
          parameters: [
            ...s.parameters,
            { id: `p-${Date.now()}`, name: "קריטריון חדש", type: "categorical", weight: 5 },
          ],
        })),

      updateParameter: (id, patch) =>
        set((s) => ({
          parameters: s.parameters.map((p) => (p.id === id ? { ...p, ...patch } : p)),
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
          assignments: autoMatch(ds, s.volunteerDS, s.parameters, s.mapping),
        })),

      setVolunteerDataset: (ds) =>
        set((s) => ({
          volunteerDS: ds,
          assignments: autoMatch(s.childDS, ds, s.parameters, s.mapping),
        })),

      loadMockData: () => {
        const c = generateMockChildren();
        const v = generateMockVolunteers();
        set({
          parameters: defaultParameters,
          mapping: defaultMapping,
          childDS: c,
          volunteerDS: v,
          assignments: autoMatch(c, v, defaultParameters, defaultMapping),
        });
      },

      runAutoMatch: () =>
        set((s) => ({
          assignments: autoMatch(s.childDS, s.volunteerDS, s.parameters, s.mapping),
        })),

      assignManual: (childIdx, volunteerIdx) =>
        set((s) => {
          const others = s.assignments.filter(
            (a) => a.childIdx !== childIdx && a.volunteerIdx !== volunteerIdx,
          );
          const ctx = buildContext(s.parameters, s.mapping, s.childDS, s.volunteerDS);
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
    }),
    {
      name: "tsamid.matching.v3",
      version: 1,
    },
  ),
);