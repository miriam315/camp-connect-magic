import type { Dataset, Mapping, Parameter } from "./types";

/**
 * The system starts empty — the user defines all parameters, mappings,
 * and uploads their own data. No mock examples are shipped.
 */
export const defaultParameters: Parameter[] = [];

export const defaultMapping: Mapping = {};

export function emptyDataset(): Dataset {
  return { columns: [], rows: [] };
}