"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, LockOpen, MonitorSmartphone } from "lucide-react";

import { KpiGrid } from "@/components/kpi/KpiGrid";
import { KpiMonthSelector } from "@/components/kpi/KpiMonthSelector";
import { KpiSaveStatus } from "@/components/kpi/KpiSaveStatus";
import { KpiToolbar } from "@/components/kpi/KpiToolbar";
import { KpiTotals } from "@/components/kpi/KpiTotals";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  KPI_SPREADSHEET_COLUMNS,
  KPI_SPREADSHEET_GROUPS,
  KpiSpreadsheetColumn
} from "@/lib/internal-kpi/spreadsheet-config";
import { createMockAutosaveController } from "@/lib/internal-kpi/spreadsheet-autosave";
import {
  clampGridPosition,
  getNormalizedSelectionRange,
  getTabGridPosition,
  GridCellPosition,
  moveGridPosition,
  parseClipboardMatrix
} from "@/lib/internal-kpi/spreadsheet-navigation";
import {
  buildSpreadsheetTotals,
  getCellValidationMessage,
  getSpreadsheetCellNumericValue,
  parseSpreadsheetInputValue,
  updateSpreadsheetRowValue
} from "@/lib/internal-kpi/spreadsheet-utils";
import {
  InternalKpiDailyRow,
  InternalKpiInputFieldKey,
  InternalKpiSaveState,
  ReportingPeriodStatus
} from "@/lib/internal-kpi/types";
import { buildBaseSpreadsheetRows } from "@/lib/internal-kpi/repository";

type Props = {
  sellerName: string;
};

function getCurrentPeriod() {
  const today = new Date();

  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1
  };
}

export function KpiSpreadsheet({ sellerName }: Props) {
  const currentPeriod = useMemo(() => getCurrentPeriod(), []);
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod);
  const [rows, setRows] = useState<InternalKpiDailyRow[]>(() =>
    buildBaseSpreadsheetRows(currentPeriod.year, currentPeriod.month)
  );
  const [saveState, setSaveState] = useState<InternalKpiSaveState>("saved");
  const [searchValue, setSearchValue] = useState("");
  const [periodStatus, setPeriodStatus] = useState<ReportingPeriodStatus>("open");
  const [selectedCell, setSelectedCell] = useState<GridCellPosition>({ rowIndex: 0, columnIndex: 1 });
  const [selectionEnd, setSelectionEnd] = useState<GridCellPosition>({ rowIndex: 0, columnIndex: 1 });
  const [editingCell, setEditingCell] = useState<GridCellPosition | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const isDraggingRef = useRef(false);
  const autosaveControllerRef = useRef<ReturnType<typeof createMockAutosaveController> | null>(null);
  const isHydratingRef = useRef(true);
  const columnCount = KPI_SPREADSHEET_COLUMNS.length;

  useEffect(() => {
    autosaveControllerRef.current = createMockAutosaveController(setSaveState);

    return () => {
      autosaveControllerRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadPeriod = async () => {
      isHydratingRef.current = true;
      setSaveState("saving");
      setEditingCell(null);
      setEditingValue("");

      try {
        const params = new URLSearchParams({
          year: String(selectedPeriod.year),
          month: String(selectedPeriod.month)
        });
        const response = await fetch(`/api/seller/kpi-period?${params.toString()}`, {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          rows?: InternalKpiDailyRow[];
          status?: ReportingPeriodStatus;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message ?? "Impossibile caricare il periodo KPI.");
        }

        if (!isActive) {
          return;
        }

        setRows(payload.rows ?? buildBaseSpreadsheetRows(selectedPeriod.year, selectedPeriod.month));
        setPeriodStatus(payload.status ?? "open");
        setSelectedCell({ rowIndex: 0, columnIndex: 1 });
        setSelectionEnd({ rowIndex: 0, columnIndex: 1 });
        setSaveState("saved");
        isHydratingRef.current = false;
      } catch {
        if (!isActive) {
          return;
        }

        // Keep isHydratingRef true so the autosave effect stays disabled: we don't know
        // the real state of this period, so we must not let a blank grid get upserted
        // over whatever data already exists on the server.
        setRows(buildBaseSpreadsheetRows(selectedPeriod.year, selectedPeriod.month));
        setPeriodStatus("open");
        setSaveState("error");
      }
    };

    void loadPeriod();

    return () => {
      isActive = false;
    };
  }, [selectedPeriod]);

  useEffect(() => {
    if (isHydratingRef.current || periodStatus !== "open") {
      return;
    }

    autosaveControllerRef.current?.notifyChange();

    const timeout = window.setTimeout(async () => {
      setSaveState("saving");

      try {
        const response = await fetch("/api/seller/kpi-period", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            year: selectedPeriod.year,
            month: selectedPeriod.month,
            rows: rows.map((row) => row.input)
          })
        });
        const payload = (await response.json()) as { message?: string; status?: ReportingPeriodStatus };

        if (!response.ok) {
          throw new Error(payload.message ?? "Impossibile salvare i KPI.");
        }

        setPeriodStatus(payload.status ?? "open");
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 850);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [periodStatus, rows, selectedPeriod]);

  const selectedMonth = selectedPeriod.month;
  const selectedYear = selectedPeriod.year;

  const setPeriod = (year: number, month: number) => {
    isHydratingRef.current = true;

    if (month < 1) {
      setSelectedPeriod({
        year: year - 1,
        month: 12
      });
      return;
    }

    if (month > 12) {
      setSelectedPeriod({
        year: year + 1,
        month: 1
      });
      return;
    }

    setSelectedPeriod({
      year,
      month
    });
  };

  const goToPreviousMonth = () => {
    setPeriod(selectedPeriod.year, selectedPeriod.month - 1);
  };

  const goToNextMonth = () => {
    setPeriod(selectedPeriod.year, selectedPeriod.month + 1);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (editingCell) {
      return;
    }

    const element = document.querySelector<HTMLElement>(
      `[data-grid-cell="${selectedCell.rowIndex}:${selectedCell.columnIndex}"]`
    );
    element?.focus();
  }, [editingCell, selectedCell]);

  const normalizedRange = getNormalizedSelectionRange(selectedCell, selectionEnd);
  const totals = useMemo(() => buildSpreadsheetTotals(rows), [rows]);

  const notifyAutosave = () => {
    if (periodStatus === "open") {
      autosaveControllerRef.current?.notifyChange();
    }
  };

  const focusPosition = (position: GridCellPosition) => {
    const clamped = clampGridPosition(position, rows.length, columnCount);
    setSelectedCell(clamped);
    setSelectionEnd(clamped);
    setEditingCell(null);
    setEditingValue("");
  };

  const handleSelect = (position: GridCellPosition, extendSelection: boolean) => {
    if (extendSelection) {
      setSelectionEnd(position);
      setSelectedCell((current) => current);
      return;
    }

    setSelectedCell(position);
    setSelectionEnd(position);
  };

  const handleStartDrag = (position: GridCellPosition) => {
    isDraggingRef.current = true;
    setSelectedCell(position);
    setSelectionEnd(position);
  };

  const handleDragOver = (position: GridCellPosition) => {
    if (!isDraggingRef.current) {
      return;
    }

    setSelectionEnd(position);
  };

  const beginEdit = (position: GridCellPosition, initialValue?: string) => {
    const column = KPI_SPREADSHEET_COLUMNS[position.columnIndex];

    if (!column || !column.editable || periodStatus !== "open") {
      return;
    }

    const row = rows[position.rowIndex];
    const rawValue = String(getSpreadsheetCellNumericValue(row, column.key as InternalKpiInputFieldKey));
    setSelectedCell(position);
    setSelectionEnd(position);
    setEditingCell(position);
    setEditingValue(initialValue ?? (rawValue === "0" ? "" : rawValue));
  };

  const applyCellValue = (position: GridCellPosition, rawValue: string) => {
    const column = KPI_SPREADSHEET_COLUMNS[position.columnIndex];

    if (!column || !column.editable || periodStatus !== "open") {
      return false;
    }

    const parsed = parseSpreadsheetInputValue(rawValue, column);

    if (parsed === null) {
      return false;
    }

    setRows((currentRows) => {
      const nextRows = [...currentRows];
      const targetRow = nextRows[position.rowIndex];
      nextRows[position.rowIndex] = updateSpreadsheetRowValue(
        targetRow,
        column.key as InternalKpiInputFieldKey,
        parsed
      );
      return nextRows;
    });
    notifyAutosave();

    return true;
  };

  const commitEdit = (direction?: "down" | "tab-forward" | "tab-backward") => {
    if (!editingCell) {
      return;
    }

    const committed = applyCellValue(editingCell, editingValue);
    setEditingCell(null);
    setEditingValue("");

    if (!committed) {
      return;
    }

    if (direction === "down") {
      focusPosition(moveGridPosition(editingCell, "down", rows.length, columnCount));
      return;
    }

    if (direction === "tab-forward") {
      focusPosition(getTabGridPosition(editingCell, "forward", rows.length, columnCount));
      return;
    }

    if (direction === "tab-backward") {
      focusPosition(getTabGridPosition(editingCell, "backward", rows.length, columnCount));
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const navigate = (direction: "up" | "down" | "left" | "right" | "tab-forward" | "tab-backward") => {
    if (direction === "tab-forward") {
      focusPosition(getTabGridPosition(selectedCell, "forward", rows.length, columnCount));
      return;
    }

    if (direction === "tab-backward") {
      focusPosition(getTabGridPosition(selectedCell, "backward", rows.length, columnCount));
      return;
    }

    focusPosition(moveGridPosition(selectedCell, direction, rows.length, columnCount));
  };

  const copySelection = async () => {
    const values: string[] = [];

    for (let rowIndex = normalizedRange.start.rowIndex; rowIndex <= normalizedRange.end.rowIndex; rowIndex += 1) {
      const rowValues: string[] = [];

      for (
        let columnIndex = normalizedRange.start.columnIndex;
        columnIndex <= normalizedRange.end.columnIndex;
        columnIndex += 1
      ) {
        const column = KPI_SPREADSHEET_COLUMNS[columnIndex];
        if (column.key === "calendar") {
          rowValues.push(rows[rowIndex].input.reportDate);
        } else {
          rowValues.push(String(getSpreadsheetCellNumericValue(rows[rowIndex], column.key as never) || ""));
        }
      }

      values.push(rowValues.join("\t"));
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(values.join("\n"));
    }
  };

  const pasteValues = (text: string) => {
    const matrix = parseClipboardMatrix(text);
    if (periodStatus !== "open") {
      return;
    }

    setRows((currentRows) => {
      const nextRows = [...currentRows];
      let appliedChanges = 0;

      matrix.forEach((matrixRow, rowOffset) => {
        matrixRow.forEach((cellValue, columnOffset) => {
          const rowIndex = selectedCell.rowIndex + rowOffset;
          const columnIndex = selectedCell.columnIndex + columnOffset;

          if (rowIndex >= nextRows.length || columnIndex >= KPI_SPREADSHEET_COLUMNS.length) {
            return;
          }

          const column = KPI_SPREADSHEET_COLUMNS[columnIndex];
          if (!column.editable) {
            return;
          }

          const parsed = parseSpreadsheetInputValue(cellValue, column);
          if (parsed === null) {
            return;
          }

          nextRows[rowIndex] = updateSpreadsheetRowValue(
            nextRows[rowIndex],
            column.key as InternalKpiInputFieldKey,
            parsed
          );
          appliedChanges += 1;
        });
      });

      if (appliedChanges > 0) {
        notifyAutosave();
      }

      return nextRows;
    });
  };

  const getValidationMessage = (rowIndex: number, columnKey: KpiSpreadsheetColumn["key"]) =>
    getCellValidationMessage(rows[rowIndex], columnKey);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Card className="flex h-full min-h-0 flex-col rounded-lg border-slate-200 shadow-none">
        <CardContent className="flex h-full min-h-0 flex-col space-y-3 p-3">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 xl:flex-row xl:items-center xl:justify-between">
            <KpiMonthSelector
              month={selectedMonth}
              year={selectedYear}
              onMonthChange={(month) => setPeriod(selectedYear, month)}
              onYearChange={(year) => setPeriod(year, selectedMonth)}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={`gap-2 rounded-full border ${
                  periodStatus === "open"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {periodStatus === "open" ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {periodStatus === "open" ? "Aperto" : "Chiuso"}
              </Badge>
              <KpiSaveStatus state={saveState} />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 rounded-lg px-3"
                onClick={goToPreviousMonth}
              >
                Mese precedente
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 rounded-lg px-3"
                onClick={goToNextMonth}
              >
                Mese successivo
              </Button>
            </div>
          </div>

          <KpiToolbar searchValue={searchValue} onSearchChange={setSearchValue} />

          <p className="px-1 text-sm text-slate-500">
            KPI mensili di {sellerName} salvati direttamente nella dashboard reale.
          </p>

          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600 md:hidden">
            <div className="flex items-start gap-3">
              <MonitorSmartphone className="mt-0.5 h-4 w-4 text-slate-500" />
              <p>
                Per lavorare al meglio sul foglio usa desktop o tablet. Da mobile puoi comunque consultare e scorrere
                la griglia.
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <KpiGrid
              columns={KPI_SPREADSHEET_COLUMNS}
              groups={KPI_SPREADSHEET_GROUPS}
              rows={rows}
              selectedCell={selectedCell}
              selectedRange={normalizedRange}
              editingCell={editingCell}
              editingValue={editingValue}
              searchValue={searchValue}
              onSelect={handleSelect}
              onStartDrag={handleStartDrag}
              onDragOver={handleDragOver}
              onBeginEdit={beginEdit}
              onEditingValueChange={setEditingValue}
              onCommitEdit={commitEdit}
              onCancelEdit={cancelEdit}
              onNavigate={navigate}
              onPasteValues={pasteValues}
              onCopySelection={copySelection}
              getValidationMessage={getValidationMessage}
            />
          </div>

          <KpiTotals totals={totals} />
        </CardContent>
      </Card>
    </div>
  );
}
