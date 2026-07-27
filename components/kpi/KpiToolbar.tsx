"use client";

import {
  AlignLeft,
  Bold,
  DollarSign,
  Filter,
  Highlighter,
  Italic,
  PaintBucket,
  Percent,
  Redo2,
  Search,
  Underline,
  Undo2
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ToolbarToggleKey =
  | "bold"
  | "italic"
  | "underline"
  | "textColor"
  | "backgroundColor"
  | "align"
  | "number"
  | "currency"
  | "percentage";

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
};

const TOOLBAR_BUTTONS: Array<{
  key: ToolbarToggleKey;
  label: string;
  icon: typeof Bold;
}> = [
  { key: "bold", label: "Grassetto", icon: Bold },
  { key: "italic", label: "Corsivo", icon: Italic },
  { key: "underline", label: "Sottolineato", icon: Underline },
  { key: "textColor", label: "Colore testo", icon: Highlighter },
  { key: "backgroundColor", label: "Colore sfondo", icon: PaintBucket },
  { key: "align", label: "Allineamento", icon: AlignLeft },
  { key: "number", label: "Formato numero", icon: AlignLeft },
  { key: "currency", label: "Formato valuta", icon: DollarSign },
  { key: "percentage", label: "Formato percentuale", icon: Percent }
];

export function KpiToolbar({ searchValue, onSearchChange }: Props) {
  const [activeToggles, setActiveToggles] = useState<Record<ToolbarToggleKey, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    textColor: true,
    backgroundColor: false,
    align: true,
    number: true,
    currency: false,
    percentage: false
  });

  const decimalHint = useMemo(() => "Demo UI: la formattazione verra collegata piu avanti.", []);

  const toggle = (key: ToolbarToggleKey) => {
    setActiveToggles((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg px-2.5" title="Annulla">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg px-2.5" title="Ripeti">
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="mx-1 hidden h-5 w-px bg-slate-200 lg:block" />

        {TOOLBAR_BUTTONS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant={activeToggles[key] ? "default" : "secondary"}
            size="sm"
            className="h-8 rounded-lg px-2.5"
            title={`${label}. ${decimalHint}`}
            onClick={() => toggle(key)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="mx-1 hidden h-5 w-px bg-slate-200 xl:block" />

        <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg px-2.5" title={decimalHint}>
          .0
        </Button>
        <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg px-2.5" title={decimalHint}>
          .00
        </Button>
        <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg px-2.5" title={decimalHint}>
          + dec
        </Button>
        <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg px-2.5" title={decimalHint}>
          - dec
        </Button>

        <div className="ml-auto flex min-w-[240px] items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cerca nel foglio"
              className="h-8 rounded-lg border-slate-200 pl-9"
            />
          </div>
          <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg px-2.5" title={decimalHint}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
