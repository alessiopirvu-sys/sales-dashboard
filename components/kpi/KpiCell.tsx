"use client";

import { KeyboardEvent, MouseEvent, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { InternalKpiDailyRow } from "@/lib/internal-kpi/types";
import { getCalendarCellLabel, getSpreadsheetCellDisplayValue } from "@/lib/internal-kpi/spreadsheet-utils";
import { KpiSpreadsheetColumn } from "@/lib/internal-kpi/spreadsheet-config";

type Props = {
  row: InternalKpiDailyRow;
  column: KpiSpreadsheetColumn;
  rowIndex: number;
  columnIndex: number;
  isWeekend: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isCurrentRow: boolean;
  isEditing: boolean;
  editingValue: string;
  validationMessage: string | null;
  highlightedSearch: boolean;
  onSelect: (position: { rowIndex: number; columnIndex: number }, extendSelection: boolean) => void;
  onStartDrag: (position: { rowIndex: number; columnIndex: number }) => void;
  onDragOver: (position: { rowIndex: number; columnIndex: number }) => void;
  onBeginEdit: (position: { rowIndex: number; columnIndex: number }, initialValue?: string) => void;
  onEditingValueChange: (value: string) => void;
  onCommitEdit: (direction?: "down" | "tab-forward" | "tab-backward") => void;
  onCancelEdit: () => void;
  onNavigate: (direction: "up" | "down" | "left" | "right" | "tab-forward" | "tab-backward") => void;
  onPasteValues: (text: string) => void;
  onCopySelection: () => void;
};

export function KpiCell({
  row,
  column,
  rowIndex,
  columnIndex,
  isWeekend,
  isSelected,
  isInRange,
  isCurrentRow,
  isEditing,
  editingValue,
  validationMessage,
  highlightedSearch,
  onSelect,
  onStartDrag,
  onDragOver,
  onBeginEdit,
  onEditingValueChange,
  onCommitEdit,
  onCancelEdit,
  onNavigate,
  onPasteValues,
  onCopySelection
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.metaKey || event.ctrlKey) {
      const key = event.key.toLowerCase();

      if (key === "c") {
        event.preventDefault();
        onCopySelection();
      }

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (column.editable) {
        onBeginEdit({ rowIndex, columnIndex });
      } else {
        onNavigate("down");
      }
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      onNavigate(event.shiftKey ? "tab-backward" : "tab-forward");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      onNavigate("up");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      onNavigate("down");
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onNavigate("left");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onNavigate("right");
      return;
    }

    if (!column.editable) {
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      onBeginEdit({ rowIndex, columnIndex }, "");
      return;
    }

    if (event.key.length === 1 && !event.altKey) {
      event.preventDefault();
      onBeginEdit({ rowIndex, columnIndex }, event.key);
    }
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommitEdit("down");
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      onCommitEdit(event.shiftKey ? "tab-backward" : "tab-forward");
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancelEdit();
    }
  };

  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    const extendSelection = event.shiftKey;
    event.currentTarget.focus();
    onSelect({ rowIndex, columnIndex }, extendSelection);
    onStartDrag({ rowIndex, columnIndex });
  };

  const baseCellClassName =
    "h-[34px] border-b border-r border-slate-200 px-0 align-middle text-[13px] text-slate-700";

  const innerClassName = cn(
    "flex h-full w-full items-center justify-end px-2 text-right transition-colors",
    isWeekend && "bg-[#F5F5F5]",
    isWeekend && "hover:bg-slate-200/60",
    isCurrentRow && "bg-slate-50",
    isInRange && "bg-blue-50/60",
    validationMessage && "bg-rose-50/60",
    highlightedSearch && "bg-amber-50",
    isSelected && "relative z-[3] ring-2 ring-inset ring-blue-500",
    column.kind === "derived" && "bg-slate-50/80 text-slate-500",
    !column.editable && column.kind === "meta" && "justify-start text-left"
  );

  if (column.key === "calendar") {
    const calendar = getCalendarCellLabel(row.input.reportDate, row.input.dayType);

    return (
      <td
        className={cn(
          baseCellClassName,
          "sticky left-0 z-[6] min-w-[82px]",
          isWeekend ? "bg-[#F5F5F5]" : "bg-white",
          isSelected && "z-[8]",
          isCurrentRow && "bg-slate-50"
        )}
      >
        <button
          type="button"
          data-grid-cell={`${rowIndex}:${columnIndex}`}
          className={innerClassName}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => onDragOver({ rowIndex, columnIndex })}
          onDoubleClick={() => onBeginEdit({ rowIndex, columnIndex })}
          onPaste={(event) => {
            event.preventDefault();
            onPasteValues(event.clipboardData.getData("text/plain"));
          }}
          title={validationMessage ?? calendar.compactDate}
        >
          <span className="font-medium tabular-nums text-slate-700">{calendar.compactDate}</span>
        </button>
      </td>
    );
  }

  return (
    <td className={cn(baseCellClassName, "relative z-0")}>
      {isEditing ? (
        <input
          ref={inputRef}
          value={editingValue}
          onChange={(event) => onEditingValueChange(event.target.value)}
          onBlur={() => onCommitEdit()}
          onKeyDown={handleEditKeyDown}
          className={cn(
            "h-full w-full border-none px-2 text-right text-[13px] font-medium text-slate-950 outline-none",
            isWeekend ? "bg-[#F5F5F5]" : "bg-white"
          )}
          inputMode={column.format === "currency" ? "decimal" : "numeric"}
        />
      ) : (
        <button
          type="button"
          data-grid-cell={`${rowIndex}:${columnIndex}`}
          className={innerClassName}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => onDragOver({ rowIndex, columnIndex })}
          onDoubleClick={() => column.editable && onBeginEdit({ rowIndex, columnIndex })}
          onPaste={(event) => {
            event.preventDefault();
            onPasteValues(event.clipboardData.getData("text/plain"));
          }}
          title={validationMessage ?? column.description ?? column.label}
        >
          {getSpreadsheetCellDisplayValue(row, column) || (
            <span className="opacity-0" aria-hidden="true">
              0
            </span>
          )}
        </button>
      )}
    </td>
  );
}
