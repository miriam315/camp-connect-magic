import * as XLSX from "xlsx";
import type { Dataset } from "./types";

export async function parseFileToDataset(file: File): Promise<Dataset> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  if (!rows.length) return { columns: [], rows: [] };
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        columns.push(k);
      }
    }
  }
  const normalized = rows.map((r) => {
    const o: Record<string, string> = {};
    for (const c of columns) o[c] = String(r[c] ?? "").trim();
    return o;
  });
  return { columns, rows: normalized };
}

function downloadXlsx(rows: Record<string, string | number>[], sheet: string, filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, filename);
}

/** Generic example file users can edit and re-upload. */
export function downloadExampleChildrenCsv() {
  downloadXlsx(
    [
      { שם: "ישראל ישראלי", גיל: 9, עיר: "תל אביב", שפה: "עברית", "רמה רפואית": 2, הערות: "אוהב משחקי כדור" },
      { שם: "דנה לוי", גיל: 7, עיר: "ירושלים", שפה: "עברית", "רמה רפואית": 1, הערות: "רגיש לרעש" },
    ],
    "ילדים",
    "example-children.xlsx",
  );
}

export function downloadExampleVolunteersCsv() {
  downloadXlsx(
    [
      { שם: "דנה כהן", גיל: 22, עיר: "ירושלים", שפה: "עברית", "רמה רפואית": 2, "שנות ניסיון": 2 },
      { שם: "אבי ברק", גיל: 25, עיר: "תל אביב", שפה: "אנגלית", "רמה רפואית": 3, "שנות ניסיון": 4 },
    ],
    "מתנדבים",
    "example-volunteers.xlsx",
  );
}