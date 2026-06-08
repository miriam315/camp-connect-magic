import * as XLSX from "xlsx";
import type { Child, Volunteer, Language, MedicalLevel } from "./types";

const medicalMap: Record<string, MedicalLevel> = {
  "אין": "none", "ללא": "none", "none": "none", "0": "none",
  "נמוך": "low", "low": "low", "1": "low",
  "בינוני": "medium", "medium": "medium", "2": "medium",
  "גבוה": "high", "high": "high", "3": "high",
};

const languageMap: Record<string, Language> = {
  "עברית": "עברית", "hebrew": "עברית", "he": "עברית",
  "ערבית": "ערבית", "arabic": "ערבית", "ar": "ערבית",
  "אנגלית": "אנגלית", "english": "אנגלית", "en": "אנגלית",
  "רוסית": "רוסית", "russian": "רוסית", "ru": "רוסית",
  "צרפתית": "צרפתית", "french": "צרפתית", "fr": "צרפתית",
};

function normMedical(v: unknown): MedicalLevel {
  const k = String(v ?? "").trim().toLowerCase();
  return medicalMap[k] ?? "none";
}

function normLang(v: unknown): Language {
  const k = String(v ?? "").trim().toLowerCase();
  return languageMap[k] ?? "עברית";
}

function normLangs(v: unknown): Language[] {
  if (Array.isArray(v)) return v.map(normLang);
  const s = String(v ?? "");
  return s.split(/[,،\/|;]+/).map((x) => x.trim()).filter(Boolean).map(normLang);
}

function normGender(v: unknown, fallback: "male" | "female" = "female"): "male" | "female" {
  const s = String(v ?? "").trim().toLowerCase();
  if (["male", "m", "זכר", "בן"].includes(s)) return "male";
  if (["female", "f", "נקבה", "בת"].includes(s)) return "female";
  return fallback;
}

function normPreferredGender(v: unknown): "male" | "female" | "any" {
  const s = String(v ?? "").trim().toLowerCase();
  if (["male", "m", "זכר", "בן"].includes(s)) return "male";
  if (["female", "f", "נקבה", "בת"].includes(s)) return "female";
  return "any";
}

function pickKey(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    for (const rk of Object.keys(row)) {
      if (rk.trim().toLowerCase() === k.trim().toLowerCase()) return row[rk];
    }
  }
  return undefined;
}

async function readSheet(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
}

export async function parseChildrenFile(file: File): Promise<Child[]> {
  const rows = await readSheet(file);
  return rows.map((row, i) => ({
    id: `c-up-${i + 1}`,
    name: String(pickKey(row, ["שם", "name"]) ?? `ילד ${i + 1}`).trim(),
    age: Number(pickKey(row, ["גיל", "age"]) ?? 0) || 0,
    city: String(pickKey(row, ["עיר", "city"]) ?? "").trim(),
    language: normLang(pickKey(row, ["שפה", "language"])),
    medicalLevel: normMedical(pickKey(row, ["רמה רפואית", "רפואי", "medical", "medicalLevel"])),
    notes: String(pickKey(row, ["הערות", "notes"]) ?? "").trim(),
    preferredGender: normPreferredGender(pickKey(row, ["מין מועדף", "preferredGender"])),
  }));
}

export async function parseVolunteersFile(file: File): Promise<Volunteer[]> {
  const rows = await readSheet(file);
  return rows.map((row, i) => ({
    id: `v-up-${i + 1}`,
    name: String(pickKey(row, ["שם", "name"]) ?? `מתנדב ${i + 1}`).trim(),
    age: Number(pickKey(row, ["גיל", "age"]) ?? 0) || 0,
    city: String(pickKey(row, ["עיר", "city"]) ?? "").trim(),
    languages: normLangs(pickKey(row, ["שפות", "שפה", "languages"])),
    medicalExperience: normMedical(pickKey(row, ["ניסיון רפואי", "רפואי", "medicalExperience"])),
    gender: normGender(pickKey(row, ["מין", "gender"])),
    experienceYears: Number(pickKey(row, ["שנות ניסיון", "ניסיון", "experienceYears"]) ?? 0) || 0,
  }));
}

export function downloadChildrenTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    { שם: "ישראל ישראלי", גיל: 9, עיר: "תל אביב", שפה: "עברית", "רמה רפואית": "בינוני", "מין מועדף": "any", הערות: "אוהב משחקי כדור" },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ילדים");
  XLSX.writeFile(wb, "תבנית-ילדים.xlsx");
}

export function downloadVolunteersTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    { שם: "דנה כהן", גיל: 22, עיר: "ירושלים", שפות: "עברית, אנגלית", "ניסיון רפואי": "נמוך", מין: "נקבה", "שנות ניסיון": 2 },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "מתנדבים");
  XLSX.writeFile(wb, "תבנית-מתנדבים.xlsx");
}