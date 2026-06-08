import type { Dataset, Mapping, Parameter } from "./types";

/**
 * Default parameter definitions, demonstrated for the camp use-case.
 * The user can edit / add / remove these freely in the Settings tab.
 */
export const defaultParameters: Parameter[] = [
  { id: "p-name", name: "שם", type: "name", weight: 0 },
  { id: "p-medical", name: "רמה רפואית", type: "gte", weight: 10 },
  { id: "p-language", name: "שפה", type: "categorical", weight: 8 },
  { id: "p-city", name: "עיר", type: "categorical", weight: 6 },
  { id: "p-age", name: "גיל", type: "numeric", weight: 4 },
];

/** Default mapping for the mock data set — columns share the same Hebrew names. */
export const defaultMapping: Mapping = {
  "p-name": { childCol: "שם", volunteerCol: "שם" },
  "p-medical": { childCol: "רמה רפואית", volunteerCol: "רמה רפואית" },
  "p-language": { childCol: "שפה", volunteerCol: "שפה" },
  "p-city": { childCol: "עיר", volunteerCol: "עיר" },
  "p-age": { childCol: "גיל", volunteerCol: "גיל" },
};

const cities = ["תל אביב", "ירושלים", "חיפה", "באר שבע", "נתניה", "ראשון לציון", "פתח תקווה", "אשדוד"];
const languages = ["עברית", "ערבית", "אנגלית", "רוסית", "צרפתית"];

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

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

export function generateMockChildren(): Dataset {
  const columns = ["שם", "גיל", "עיר", "שפה", "רמה רפואית", "הערות"];
  const rows = childNames.map((name, i) => ({
    "שם": name,
    "גיל": String(6 + (i % 12)),
    "עיר": pick(cities, i * 3),
    "שפה": pick(languages, i * 2),
    "רמה רפואית": String(i % 4),
    "הערות": i % 3 === 0 ? "אוהב מוזיקה" : "רגיש לחושים",
  }));
  return { columns, rows };
}

export function generateMockVolunteers(): Dataset {
  const columns = ["שם", "גיל", "עיר", "שפה", "רמה רפואית", "שנות ניסיון"];
  const rows = volunteerNames.map((name, i) => ({
    "שם": name,
    "גיל": String(18 + (i % 25)),
    "עיר": pick(cities, i * 2 + 1),
    "שפה": pick(languages, i),
    "רמה רפואית": String((i + 1) % 4),
    "שנות ניסיון": String(i % 6),
  }));
  return { columns, rows };
}