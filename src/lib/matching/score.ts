import type { Child, Volunteer, Priorities, Assignment, MedicalLevel } from "./types";

const medicalRank: Record<MedicalLevel, number> = { none: 0, low: 1, medium: 2, high: 3 };

export const defaultPriorities: Priorities = {
  medical: 90,
  language: 75,
  geography: 60,
  age: 40,
};

export function scorePair(child: Child, volunteer: Volunteer, p: Priorities): number {
  const total = p.medical + p.language + p.geography + p.age || 1;

  // Medical: volunteer experience must be >= child level
  const need = medicalRank[child.medicalLevel];
  const have = medicalRank[volunteer.medicalExperience];
  const medicalScore = have >= need ? 1 : Math.max(0, 1 - (need - have) * 0.4);

  // Language: shared language
  const languageScore = volunteer.languages.includes(child.language) ? 1 : 0.2;

  // Geography: same city
  const geoScore = volunteer.city === child.city ? 1 : 0.35;

  // Age: volunteer should be older — sweet spot 8-20 years
  const gap = volunteer.age - child.age;
  const ageScore = gap >= 6 && gap <= 25 ? 1 : gap > 0 ? 0.6 : 0.1;

  // Gender preference
  const genderOk = !child.preferredGender || child.preferredGender === "any" || child.preferredGender === volunteer.gender;
  const genderMult = genderOk ? 1 : 0.7;

  const weighted =
    (medicalScore * p.medical +
      languageScore * p.language +
      geoScore * p.geography +
      ageScore * p.age) /
    total;

  return Math.round(weighted * genderMult * 100);
}

export function scoreTier(score: number): "high" | "med" | "low" {
  if (score >= 80) return "high";
  if (score >= 60) return "med";
  return "low";
}

/** Greedy optimal assignment by descending score. */
export function autoMatch(
  children: Child[],
  volunteers: Volunteer[],
  p: Priorities,
): Assignment[] {
  const pairs: Assignment[] = [];
  for (const c of children) {
    for (const v of volunteers) {
      pairs.push({ childId: c.id, volunteerId: v.id, score: scorePair(c, v, p) });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const usedC = new Set<string>();
  const usedV = new Set<string>();
  const result: Assignment[] = [];
  for (const pair of pairs) {
    if (usedC.has(pair.childId) || usedV.has(pair.volunteerId)) continue;
    usedC.add(pair.childId);
    usedV.add(pair.volunteerId);
    result.push(pair);
  }
  return result;
}

export function bestVolunteersFor(
  child: Child,
  volunteers: Volunteer[],
  p: Priorities,
  excludeIds: Set<string>,
  limit = 3,
): Array<{ volunteer: Volunteer; score: number }> {
  return volunteers
    .filter((v) => !excludeIds.has(v.id))
    .map((v) => ({ volunteer: v, score: scorePair(child, v, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}