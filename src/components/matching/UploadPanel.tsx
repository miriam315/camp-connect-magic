import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Child, Volunteer } from "@/lib/matching/types";
import {
  parseChildrenFile,
  parseVolunteersFile,
  downloadChildrenTemplate,
  downloadVolunteersTemplate,
} from "@/lib/matching/parse";

interface Props {
  childrenCount: number;
  volunteersCount: number;
  onChildren: (c: Child[]) => void;
  onVolunteers: (v: Volunteer[]) => void;
  onResetMock: () => void;
}

export function UploadPanel({ childrenCount, volunteersCount, onChildren, onVolunteers, onResetMock }: Props) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">טעינת נתונים</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          העלו קובץ Excel או CSV של הילדים והמתנדבים. ניתן להוריד תבנית מוכנה למילוי.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DropZone
            title="רשימת ילדים"
            description="עמודות: שם, גיל, עיר, שפה, רמה רפואית, מין מועדף, הערות"
            currentCount={childrenCount}
            onTemplate={downloadChildrenTemplate}
            onFile={async (file) => {
              try {
                const data = await parseChildrenFile(file);
                if (!data.length) throw new Error("הקובץ ריק");
                onChildren(data);
                toast.success(`נטענו ${data.length} ילדים`);
              } catch (e) {
                toast.error("שגיאה בטעינת הקובץ", { description: String((e as Error).message) });
              }
            }}
          />

          <DropZone
            title="רשימת מתנדבים"
            description="עמודות: שם, גיל, עיר, שפות, ניסיון רפואי, מין, שנות ניסיון"
            currentCount={volunteersCount}
            onTemplate={downloadVolunteersTemplate}
            onFile={async (file) => {
              try {
                const data = await parseVolunteersFile(file);
                if (!data.length) throw new Error("הקובץ ריק");
                onVolunteers(data);
                toast.success(`נטענו ${data.length} מתנדבים`);
              } catch (e) {
                toast.error("שגיאה בטעינת הקובץ", { description: String((e as Error).message) });
              }
            }}
          />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            ניתן לחזור לנתוני הדמו לדוגמה בכל עת.
          </p>
          <Button variant="ghost" size="sm" onClick={onResetMock}>
            טען נתוני דמו
          </Button>
        </div>
      </div>
    </div>
  );
}

function DropZone({
  title,
  description,
  currentCount,
  onTemplate,
  onFile,
}: {
  title: string;
  description: string;
  currentCount: number;
  onTemplate: () => void;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    onFile(files[0]);
  };

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
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative rounded-xl border-2 border-dashed p-6 text-center transition ${
        hover ? "border-primary bg-primary/5" : "border-border bg-background"
      }`}
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileSpreadsheet className="size-6" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>

      {currentCount > 0 && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-match-high">
          <CheckCircle2 className="size-3.5" /> {currentCount} רשומות נטענו
        </p>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        <Button size="sm" onClick={() => inputRef.current?.click()} className="gap-2">
          <Upload className="size-4" /> בחירת קובץ
        </Button>
        <Button size="sm" variant="outline" onClick={onTemplate} className="gap-2">
          <Download className="size-4" /> תבנית
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}