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
  | "gte"         // volunteer value >= child value (e.g., medical skill level)
  | "reward"      // volunteer-side numeric used as a bonus (e.g., גמול)
  | "range"       // numeric bucketed into named categories (e.g., Age → Small/Medium/Large)
  | "preferredName"; // volunteer-side list of preferred child names → soft bonus on the final score

/** Named numeric bucket used by `range` parameters. min/max are inclusive. */
export interface RangeBucket {
  label: string;
  min: number;
  max: number;
}

export interface Parameter {
  id: string;
  name: string;     // Hebrew label shown to user
  type: ParamType;
  weight: number;   // 1..10
  /** Whether this parameter participates in scoring. */
  enabled?: boolean;
  /** Canonical allowed values used for validation (categorical/multi). */
  allowedValues?: string[];
  /** Raw → canonical mapping (lower-cased keys). Applied before scoring. */
  synonyms?: Record<string, string>;
  /** For `range` parameters: user-defined numeric buckets (e.g., Small=0-9). */
  ranges?: RangeBucket[];
  /** For `preferredName` parameters: how many points to add to the final score when matched (default 15). */
  bonusValue?: number;
  /**
   * Optional flexible constraint applied per pair.
   * Example: "no volunteer over age 9" → { kind: 'maxVolunteer', value: 9 }.
   * "Flexible" means it zeroes this parameter's score only — it does not block assignment.
   */
  constraint?:
    | { kind: "maxVolunteer"; value: number }
    | { kind: "minVolunteer"; value: number };
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