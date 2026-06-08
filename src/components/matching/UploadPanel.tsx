import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/matching/store";
import {
  downloadExampleChildrenCsv,
  downloadExampleVolunteersCsv,
  parseFileToDataset,
} from "@/lib/matching/parse";
import { MappingPanel } from "./MappingPanel";

export function UploadPanel() {
  const childDS = useAppStore((s) => s.childDS);
  const volunteerDS = useAppStore((s) => s.volunteerDS);
  const setChildDataset = useAppStore((s) => s.setChildDataset);
  const setVolunteerDataset = useAppStore((s) => s.setVolunteerDataset);
  const loadMockData = useAppStore((s) => s.loadMockData);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">טעינת נתונים</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          העלו קובץ CSV או Excel. אין צורך בשמות עמודות קבועים — לאחר ההעלאה תוכלו למפות כל עמודה לקריטריון.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DropZone
            title="קובץ ילדים"
            columnsCount={childDS.columns.length}
            rowsCount={childDS.rows.length}
            onExample={downloadExampleChildrenCsv}
            onFile={async (file) => {
              try {
                const ds = await parseFileToDataset(file);
                if (!ds.rows.length) throw new Error("הקובץ ריק");
                setChildDataset(ds);
                toast.success(`נטענו ${ds.rows.length} ילדים`, {
                  description: "עברו למיפוי העמודות בהמשך העמוד.",
                });
              } catch (e) {
                toast.error("שגיאה בטעינת הקובץ", { description: String((e as Error).message) });
              }
            }}
          />
          <DropZone
            title="קובץ מתנדבים"
            columnsCount={volunteerDS.columns.length}
            rowsCount={volunteerDS.rows.length}
            onExample={downloadExampleVolunteersCsv}
            onFile={async (file) => {
              try {
                const ds = await parseFileToDataset(file);
                if (!ds.rows.length) throw new Error("הקובץ ריק");
                setVolunteerDataset(ds);
                toast.success(`נטענו ${ds.rows.length} מתנדבים`, {
                  description: "עברו למיפוי העמודות בהמשך העמוד.",
                });
              } catch (e) {
                toast.error("שגיאה בטעינת הקובץ", { description: String((e as Error).message) });
              }
            }}
          />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">ניתן לטעון נתוני דמו לדוגמה בכל עת.</p>
          <Button variant="ghost" size="sm" onClick={loadMockData}>
            טען נתוני דמו
          </Button>
        </div>
      </div>

      <MappingPanel />
    </div>
  );
}

function DropZone({
  title,
  rowsCount,
  columnsCount,
  onExample,
  onFile,
}: {
  title: string;
  rowsCount: number;
  columnsCount: number;
  onExample: () => void;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`relative rounded-xl border-2 border-dashed p-6 text-center transition ${
        hover ? "border-primary bg-primary/5" : "border-border bg-background"
      }`}
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileSpreadsheet className="size-6" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      {rowsCount > 0 && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-match-high">
          <CheckCircle2 className="size-3.5" /> {rowsCount} שורות · {columnsCount} עמודות
        </p>
      )}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button size="sm" onClick={() => inputRef.current?.click()} className="gap-2">
          <Upload className="size-4" /> בחירת קובץ
        </Button>
        <Button size="sm" variant="outline" onClick={onExample} className="gap-2">
          <Download className="size-4" /> קובץ לדוגמה
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </div>
  );
}