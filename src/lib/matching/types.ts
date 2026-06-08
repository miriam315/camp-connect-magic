/**
 * Dynamic, user-defined matching model.
 * The user defines Parameters in Settings, then maps each Parameter to
 * a column from the uploaded children file and a column from the
 * uploaded volunteers file.
 */

export type ParamType =
  | "name"        // display name (no scoring)
  | "categorical" // exact equality (e.g., city, language)
  | "multi"       // comma/semicolon-separated lists; score by intersection
  | "numeric"     // closer values = better (e.g., age proximity)
  | "gte";        // volunteer value >= child value (e.g., medical skill level)

export interface Parameter {
  id: string;
  name: string;     // Hebrew label shown to user
  type: ParamType;
  weight: number;   // 1..10
}

export interface SideMapping {
  childCol?: string;
  volunteerCol?: string;
}

export type Mapping = Record<string, SideMapping>; // paramId -> SideMapping

export type Row = Record<string, string>;

export interface Dataset {
  columns: string[];
  rows: Row[];
}

export interface Assignment {
  childIdx: number;
  volunteerIdx: number;
  score: number;
}