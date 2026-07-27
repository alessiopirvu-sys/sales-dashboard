"use client";

import { useMemo } from "react";

import { InternalKpiDailyRow } from "@/lib/internal-kpi/types";
import { KpiSpreadsheetColumn, KpiSpreadsheetGroup } from "@/lib/internal-kpi/spreadsheet-config";
import { GridCellPosition, GridSelectionRange, isPositionInsideRange } from "@/lib/internal-kpi/spreadsheet-navigation";
import { KpiCell } from "@/components/kpi/KpiCell";

type Props = {
  columns: KpiSpreadsheetColumn[];
  groups: KpiSpreadsheetGroup[];
  rows: InternalKpiDailyRow[];
  selectedCell: GridCellPosition;
  selectedRange: GridSelectionRange;
  editingCell: GridCellPosition | null;
  editingValue: string;
  searchValue: string;
  onSelect: (position: GridCellPosition, extendSelection: boolean) => void;
  onStartDrag: (position: GridCellPosition) => void;
  onDragOver: (position: GridCellPosition) => void;
  onBeginEdit: (position: GridCellPosition, initialValue?: string) => void;
  onEditingValueChange: (value: string) => void;
  onCommitEdit: (direction?: "down" | "tab-forward" | "tab-backward") => void;
  onCancelEdit: () => void;
  onNavigate: (direction: "up" | "down" | "left" | "right" | "tab-forward" | "tab-backward") => void;
  onPasteValues: (text: string) => void;
  onCopySelection: () => void;
  getValidationMessage: (rowIndex: number, columnKey: KpiSpreadsheetColumn["key"]) => string | null;
};

export function KpiGrid({
  columns,
  groups,
  rows,
  selectedCell,
  selectedRange,
  editingCell,
  editingValue,
  searchValue,
  onSelect,
  onStartDrag,
  onDragOver,
  onBeginEdit,
  onEditingValueChange,
  onCommitEdit,
  onCancelEdit,
  onNavigate,
  onPasteValues,
  onCopySelection,
  getValidationMessage
}: Props) {
  const groupedColumns = useMemo(
    () =>
      groups.map((group) => ({
        group,
        columns: columns.filter((column) => column.group === group.key)
      })),
    [columns, groups]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="kpi-scrollbar min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {groupedColumns.map(({ group, columns: currentColumns }) => (
                <th
                  key={group.key}
                  colSpan={currentColumns.length}
                  className={`sticky top-0 z-[5] h-8 border-b border-r px-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] ${group.accentClass} ${group.borderClass} ${
                    group.key === "calendar" ? "sticky left-0 z-[7]" : ""
                  }`}
                >
                  {group.label}
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((column, columnIndex) => (
                <th
                  key={column.key}
                  className={`sticky top-8 z-[4] h-8 border-b border-r border-slate-200 bg-white px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${
                    column.key === "calendar" ? "left-0 z-[6] text-left" : "text-right"
                  }`}
                  style={{ minWidth: column.width, width: column.width }}
                  data-column-index={columnIndex}
                  title={column.description ?? column.label}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.input.reportDate}>
                {columns.map((column, columnIndex) => {
                  const position = { rowIndex, columnIndex };
                  const isWeekend = row.input.dayType === "SAB" || row.input.dayType === "DOM";
                  const isInRange = isPositionInsideRange(position, selectedRange);
                  const isSelected =
                    selectedCell.rowIndex === rowIndex && selectedCell.columnIndex === columnIndex;
                  const isEditing =
                    editingCell?.rowIndex === rowIndex && editingCell?.columnIndex === columnIndex;
                  const validationMessage = getValidationMessage(rowIndex, column.key);
                  const highlightedSearch =
                    searchValue.trim().length > 0 &&
                    column.label.toLowerCase().includes(searchValue.trim().toLowerCase());

                  return (
                    <KpiCell
                      key={`${row.input.reportDate}-${column.key}`}
                      row={row}
                      column={column}
                      rowIndex={rowIndex}
                      columnIndex={columnIndex}
                      isWeekend={isWeekend}
                      isSelected={isSelected}
                      isInRange={isInRange}
                      isCurrentRow={selectedCell.rowIndex === rowIndex}
                      isEditing={isEditing}
                      editingValue={editingValue}
                      validationMessage={validationMessage}
                      highlightedSearch={highlightedSearch}
                      onSelect={onSelect}
                      onStartDrag={onStartDrag}
                      onDragOver={onDragOver}
                      onBeginEdit={onBeginEdit}
                      onEditingValueChange={onEditingValueChange}
                      onCommitEdit={onCommitEdit}
                      onCancelEdit={onCancelEdit}
                      onNavigate={onNavigate}
                      onPasteValues={onPasteValues}
                      onCopySelection={onCopySelection}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
