import { InternalKpiSaveState } from "@/lib/internal-kpi/types";

export const MOCK_AUTOSAVE_DELAY_MS = 720;
export const MOCK_AUTOSAVE_SAVING_MS = 140;

export function createMockAutosaveController(
  onStateChange: (state: InternalKpiSaveState) => void,
  delayMs = MOCK_AUTOSAVE_DELAY_MS,
  savingMs = MOCK_AUTOSAVE_SAVING_MS
) {
  let revision = 0;
  let dirtyTimeout: ReturnType<typeof setTimeout> | null = null;
  let savedTimeout: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (dirtyTimeout) {
      clearTimeout(dirtyTimeout);
      dirtyTimeout = null;
    }

    if (savedTimeout) {
      clearTimeout(savedTimeout);
      savedTimeout = null;
    }
  };

  return {
    notifyChange() {
      revision += 1;
      const currentRevision = revision;
      clearTimers();
      onStateChange("dirty");

      dirtyTimeout = setTimeout(() => {
        if (currentRevision !== revision) {
          return;
        }

        onStateChange("saving");
      }, savingMs);

      savedTimeout = setTimeout(() => {
        if (currentRevision !== revision) {
          return;
        }

        onStateChange("saved");
      }, delayMs);
    },
    dispose() {
      clearTimers();
    }
  };
}
