import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Settings2, RotateCcw } from "lucide-react";
import type { Priorities } from "@/lib/matching/types";
import { defaultPriorities } from "@/lib/matching/score";

interface Props {
  priorities: Priorities;
  onChange: (p: Priorities) => void;
}

const rows: Array<{ key: keyof Priorities; label: string; hint: string }> = [
  { key: "medical", label: "Medical experience", hint: "Match volunteer skills to child's medical needs" },
  { key: "language", label: "Shared language", hint: "Prioritize common language" },
  { key: "geography", label: "Geographic proximity", hint: "Prefer same-city pairs" },
  { key: "age", label: "Age compatibility", hint: "Healthy age gap between volunteer and child" },
];

export function SettingsDrawer({ priorities, onChange }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="size-4" /> Priorities
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Matching priorities</SheetTitle>
          <SheetDescription>
            Tune the weights used by the smart matcher. Changes apply to future Smart-Suggest runs.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-7 px-1">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.hint}</p>
                </div>
                <span className="font-mono text-sm font-semibold text-primary tabular-nums">
                  {priorities[row.key]}
                </span>
              </div>
              <Slider
                value={[priorities[row.key]]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) => onChange({ ...priorities, [row.key]: v })}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 px-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => onChange(defaultPriorities)}
          >
            <RotateCcw className="size-4" /> Reset to defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}