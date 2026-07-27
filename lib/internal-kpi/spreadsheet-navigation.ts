export type GridCellPosition = {
  rowIndex: number;
  columnIndex: number;
};

export type GridSelectionRange = {
  start: GridCellPosition;
  end: GridCellPosition;
};

export function clampGridPosition(
  position: GridCellPosition,
  rowCount: number,
  columnCount: number
): GridCellPosition {
  return {
    rowIndex: Math.min(Math.max(position.rowIndex, 0), Math.max(rowCount - 1, 0)),
    columnIndex: Math.min(Math.max(position.columnIndex, 0), Math.max(columnCount - 1, 0))
  };
}

export function getNormalizedSelectionRange(
  start: GridCellPosition,
  end: GridCellPosition
): GridSelectionRange {
  return {
    start: {
      rowIndex: Math.min(start.rowIndex, end.rowIndex),
      columnIndex: Math.min(start.columnIndex, end.columnIndex)
    },
    end: {
      rowIndex: Math.max(start.rowIndex, end.rowIndex),
      columnIndex: Math.max(start.columnIndex, end.columnIndex)
    }
  };
}

export function isPositionInsideRange(position: GridCellPosition, range: GridSelectionRange) {
  const normalized = getNormalizedSelectionRange(range.start, range.end);

  return (
    position.rowIndex >= normalized.start.rowIndex &&
    position.rowIndex <= normalized.end.rowIndex &&
    position.columnIndex >= normalized.start.columnIndex &&
    position.columnIndex <= normalized.end.columnIndex
  );
}

export function moveGridPosition(
  position: GridCellPosition,
  direction: "up" | "down" | "left" | "right",
  rowCount: number,
  columnCount: number
) {
  switch (direction) {
    case "up":
      return clampGridPosition(
        {
          rowIndex: position.rowIndex - 1,
          columnIndex: position.columnIndex
        },
        rowCount,
        columnCount
      );
    case "down":
      return clampGridPosition(
        {
          rowIndex: position.rowIndex + 1,
          columnIndex: position.columnIndex
        },
        rowCount,
        columnCount
      );
    case "left":
      return clampGridPosition(
        {
          rowIndex: position.rowIndex,
          columnIndex: position.columnIndex - 1
        },
        rowCount,
        columnCount
      );
    case "right":
      return clampGridPosition(
        {
          rowIndex: position.rowIndex,
          columnIndex: position.columnIndex + 1
        },
        rowCount,
        columnCount
      );
  }
}

export function getTabGridPosition(
  position: GridCellPosition,
  direction: "forward" | "backward",
  rowCount: number,
  columnCount: number
) {
  if (direction === "forward") {
    if (position.columnIndex < columnCount - 1) {
      return { rowIndex: position.rowIndex, columnIndex: position.columnIndex + 1 };
    }

    return clampGridPosition(
      {
        rowIndex: position.rowIndex + 1,
        columnIndex: 0
      },
      rowCount,
      columnCount
    );
  }

  if (position.columnIndex > 0) {
    return { rowIndex: position.rowIndex, columnIndex: position.columnIndex - 1 };
  }

  return clampGridPosition(
    {
      rowIndex: position.rowIndex - 1,
      columnIndex: columnCount - 1
    },
    rowCount,
    columnCount
  );
}

export function parseClipboardMatrix(value: string) {
  return value
    .trimEnd()
    .split(/\r?\n/)
    .map((row) => row.split("\t"));
}
