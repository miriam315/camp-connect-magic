import type { Dataset, Mapping, Parameter } from "./types";

/**
 * Default parameter definitions, demonstrated for the camp use-case.
 * The user can edit / add / remove these freely in the Settings tab.
 */
export const defaultParameters: Parameter[] = [
  { id: "p-name", name: "שם", type: "name", weight: 0 },
  {
    id: "p-disability",
    name: "מוגבלות",
    type: "categorical",
    weight: 10,
    enabled: true,
    allowedValues: ["תסמונת דאון", "אוטיזם", "שיתוק מוחין", "פיגור שכלי", "ADHD"],
    synonyms: {
      "ת.ד.": "תסמונת דאון",
      "ת. ד.": "תסמונת דאון",
      "תד": "תסמונת דאון",
      "down": "תסמונת דאון",
      "down syndrome": "תסמונת דאון",
      "אוטיזם בתפקוד גבוה": "אוטיזם",
      "asd": "אוטיזם",
      "cp": "שיתוק מוחין",
      "adhd": "ADHD",
      "הפרעת קשב": "ADHD",
    },
  },
  {
    id: "p-difficulty",
    name: "רמת קושי",
    type: "categorical",
    weight: 8,
    enabled: true,
    allowedValues: ["קל", "בינוני", "מורכב"],
    synonyms: {
      "small": "קל",
      "low": "קל",
      "easy": "קל",
      "medium": "בינוני",
      "med": "בינוני",
      "regular": "בינוני",
      "high": "מורכב",
      "hard": "מורכב",
      "complex": "מורכב",
    },
  },
  { id: "p-language", name: "שפה", type: "categorical", weight: 6, enabled: true },
  { id: "p-city", name: "עיר", type: "categorical", weight: 5, enabled: true },
  {
    id: "p-age",
    name: "גיל",
    type: "range",
    weight: 4,
    enabled: true,
    ranges: [
      { label: "קטן (0-9)", min: 0, max: 9 },
      { label: "בינוני (10-15)", min: 10, max: 15 },
      { label: "נוער (16-21)", min: 16, max: 21 },
      { label: "בוגר (22-35)", min: 22, max: 35 },
      { label: "מבוגר (36+)", min: 36, max: 200 },
    ],
  },
  {
    id: "p-reward",
    name: "גמול / ניסיון",
    type: "reward",
    weight: 3,
    enabled: true,
  },
];

/** Default mapping for the mock data set — columns share the same Hebrew names. */
export const defaultMapping: Mapping = {
  "p-name": { childCol: "שם", volunteerCol: "שם" },
  "p-disability": { childCol: "מוגבלות", volunteerCol: "התמחות" },
  "p-difficulty": { childCol: "רמת קושי", volunteerCol: "רמת קושי" },
  "p-language": { childCol: "שפה", volunteerCol: "שפה" },
  "p-city": { childCol: "עיר", volunteerCol: "עיר" },
  "p-age": { childCol: "גיל", volunteerCol: "גיל" },
  "p-reward": { childCol: undefined, volunteerCol: "גמול" },
};

const cities = ["תל אביב", "ירושלים", "חיפה", "באר שבע", "נתניה", "ראשון לציון", "פתח תקווה", "אשדוד"];
const languages = ["עברית", "ערבית", "אנגלית", "רוסית", "צרפתית"];

// Mix of canonical + raw forms to exercise the synonym layer + validation.
const disabilitiesRaw = ["תסמונת דאון", "ת.ד.", "אוטיזם", "ASD", "שיתוק מוחין", "CP", "ADHD", "הפרעת קשב"];
const difficultyRaw = ["קל", "בינוני", "מורכב", "Small", "Medium", "High"];
const specialties = ["תסמונת דאון", "אוטיזם", "שיתוק מוחין", "ADHD", "פיגור שכלי"];

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
  const columns = ["שם", "גיל", "עיר", "שפה", "מוגבלות", "רמת קושי", "הערות"];
  const rows = childNames.map((name, i) => ({
    "שם": name,
    "גיל": String(6 + (i % 10)),
    "עיר": pick(cities, i * 3),
    "שפה": pick(languages, i * 2),
    "מוגבלות": pick(disabilitiesRaw, i),
    "רמת קושי": pick(difficultyRaw, i + 1),
    "הערות": i % 3 === 0 ? "אוהב מוזיקה" : "רגיש לחושים",
  }));
  return { columns, rows };
}

export function generateMockVolunteers(): Dataset {
  const columns = ["שם", "גיל", "עיר", "שפה", "התמחות", "רמת קושי", "גמול", "שנות ניסיון"];
  const rows = volunteerNames.map((name, i) => ({
    "שם": name,
    "גיל": String(18 + (i % 25)),
    "עיר": pick(cities, i * 2 + 1),
    "שפה": pick(languages, i),
    "התמחות": pick(specialties, i + 2),
    "רמת קושי": pick(difficultyRaw, i),
    "גמול": String(1 + (i % 5)),
    "שנות ניסיון": String(i % 6),
  }));
  return { columns, rows };
}