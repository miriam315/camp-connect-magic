import type { Child, Volunteer, Language, MedicalLevel } from "./types";

const cities = ["תל אביב", "ירושלים", "חיפה", "באר שבע", "נתניה", "ראשון לציון", "פתח תקווה", "אשדוד"];
const languages: Language[] = ["עברית", "ערבית", "אנגלית", "רוסית", "צרפתית"];
const medical: MedicalLevel[] = ["none", "low", "medium", "high"];

const childNames = [
  "נועם לוי", "אדם כהן", "יעל מזרחי", "איתי בר", "מאיה פרץ",
  "רוני אזולאי", "תומר פרידמן", "שירה בן-דוד", "איתן גולד", "ליאם ששון",
  "טליה כץ", "דניאל אוחנה", "אביגיל שטרן", "יונתן רובין", "הילה ואקנין",
  "עומר טל", "ליאור שפירא", "נעמי זיו", "אריאל דהן", "עדן הלוי",
];

const volunteerNames = [
  "שרה קליין", "דוד מור", "רבקה אדלר", "יוסי חדד", "מיכל אשל",
  "אבי ברק", "תמר לב", "נדב רון", "אפרת דיין", "גלעד עמית",
  "אור רותם", "מאיה עובדיה", "טל שמש", "רונן כרמי", "הדר ביטון",
  "יעל סגל", "אייל ניר", "דנה פלד", "איתמר בלוך", "נועה ארז",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export function generateMockChildren(): Child[] {
  return childNames.map((name, i) => ({
    id: `c${i + 1}`,
    name,
    age: 6 + (i % 12),
    city: pick(cities, i * 3),
    language: pick(languages, i * 2),
    medicalLevel: pick(medical, i + 1),
    notes: i % 4 === 0 ? "זקוק לסביבה רגועה" : i % 3 === 0 ? "אוהב מוזיקה" : "רגיש לחושים",
    preferredGender: i % 5 === 0 ? "female" : i % 7 === 0 ? "male" : "any",
  }));
}

export function generateMockVolunteers(): Volunteer[] {
  return volunteerNames.map((name, i) => ({
    id: `v${i + 1}`,
    name,
    age: 18 + (i % 25),
    city: pick(cities, i * 2 + 1),
    languages: i % 3 === 0
      ? [pick(languages, i), pick(languages, i + 1)]
      : [pick(languages, i)],
    medicalExperience: pick(medical, i),
    gender: i % 2 === 0 ? "female" : "male",
    experienceYears: i % 6,
  }));
}