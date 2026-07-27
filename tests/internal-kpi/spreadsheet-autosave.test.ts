import { describe, expect, it, vi } from "vitest";

import {
  createMockAutosaveController,
  MOCK_AUTOSAVE_DELAY_MS,
  MOCK_AUTOSAVE_SAVING_MS
} from "../../lib/internal-kpi/spreadsheet-autosave";

describe("mock autosave controller", () => {
  it("simula la sequenza dirty -> saving -> saved", () => {
    vi.useFakeTimers();
    const states: string[] = [];
    const controller = createMockAutosaveController((state) => states.push(state));

    controller.notifyChange();
    expect(states).toEqual(["dirty"]);

    vi.advanceTimersByTime(MOCK_AUTOSAVE_SAVING_MS);
    expect(states).toEqual(["dirty", "saving"]);

    vi.advanceTimersByTime(MOCK_AUTOSAVE_DELAY_MS - MOCK_AUTOSAVE_SAVING_MS);
    expect(states).toEqual(["dirty", "saving", "saved"]);

    controller.dispose();
    vi.useRealTimers();
  });

  it("annulla il salvataggio precedente se arriva una nuova modifica", () => {
    vi.useFakeTimers();
    const states: string[] = [];
    const controller = createMockAutosaveController((state) => states.push(state));

    controller.notifyChange();
    vi.advanceTimersByTime(MOCK_AUTOSAVE_SAVING_MS - 20);
    controller.notifyChange();

    vi.advanceTimersByTime(MOCK_AUTOSAVE_SAVING_MS);
    vi.advanceTimersByTime(MOCK_AUTOSAVE_DELAY_MS);

    expect(states).toEqual(["dirty", "dirty", "saving", "saved"]);

    controller.dispose();
    vi.useRealTimers();
  });
});
