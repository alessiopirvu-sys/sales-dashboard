import { describe, expect, it } from "vitest";

import {
  clampGridPosition,
  getNormalizedSelectionRange,
  getTabGridPosition,
  isPositionInsideRange,
  moveGridPosition,
  parseClipboardMatrix
} from "../../lib/internal-kpi/spreadsheet-navigation";

describe("spreadsheet navigation", () => {
  it("clampa la posizione della cella nei limiti della griglia", () => {
    expect(clampGridPosition({ rowIndex: -2, columnIndex: 99 }, 10, 8)).toEqual({
      rowIndex: 0,
      columnIndex: 7
    });
  });

  it("gestisce la navigazione con Tab avanti e indietro", () => {
    expect(getTabGridPosition({ rowIndex: 0, columnIndex: 2 }, "forward", 5, 4)).toEqual({
      rowIndex: 0,
      columnIndex: 3
    });

    expect(getTabGridPosition({ rowIndex: 0, columnIndex: 3 }, "forward", 5, 4)).toEqual({
      rowIndex: 1,
      columnIndex: 0
    });

    expect(getTabGridPosition({ rowIndex: 1, columnIndex: 0 }, "backward", 5, 4)).toEqual({
      rowIndex: 0,
      columnIndex: 3
    });
  });

  it("sposta la cella con le frecce direzionali", () => {
    expect(moveGridPosition({ rowIndex: 2, columnIndex: 2 }, "up", 10, 10)).toEqual({
      rowIndex: 1,
      columnIndex: 2
    });

    expect(moveGridPosition({ rowIndex: 2, columnIndex: 2 }, "right", 10, 10)).toEqual({
      rowIndex: 2,
      columnIndex: 3
    });
  });

  it("calcola correttamente l'intervallo selezionato e l'appartenenza di una cella", () => {
    const range = getNormalizedSelectionRange(
      { rowIndex: 4, columnIndex: 5 },
      { rowIndex: 1, columnIndex: 2 }
    );

    expect(range).toEqual({
      start: { rowIndex: 1, columnIndex: 2 },
      end: { rowIndex: 4, columnIndex: 5 }
    });

    expect(isPositionInsideRange({ rowIndex: 3, columnIndex: 3 }, range)).toBe(true);
    expect(isPositionInsideRange({ rowIndex: 0, columnIndex: 3 }, range)).toBe(false);
  });

  it("fa il parse di copia e incolla rettangolare", () => {
    expect(parseClipboardMatrix("1\t2\n3\t4")).toEqual([
      ["1", "2"],
      ["3", "4"]
    ]);
  });
});
