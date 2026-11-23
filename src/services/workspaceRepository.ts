import { createInitialWorkspaceData, WorkspaceSnapshot } from "./demoDataService";

const STORAGE_KEY = "raqimo_workspace_demo_v1";

export const workspaceRepository = {
  load(): WorkspaceSnapshot {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = createInitialWorkspaceData();
        this.save(initial);
        return initial;
      }
      const parsed = JSON.parse(raw) as WorkspaceSnapshot;
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.leads)) {
        const initial = createInitialWorkspaceData();
        this.save(initial);
        return initial;
      }
      return parsed;
    } catch {
      return createInitialWorkspaceData();
    }
  },

  save(snapshot: WorkspaceSnapshot): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage quota or unavailable
    }
  },

  reset(): WorkspaceSnapshot {
    const initial = createInitialWorkspaceData();
    this.save(initial);
    return initial;
  },
};
