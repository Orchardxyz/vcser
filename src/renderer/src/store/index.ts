import { create } from "zustand";
import type { ResolvedEditor } from "../types";
import { invoke } from "../ipc";

interface AppStoreState {
  shellReady: boolean;
  setShellReady: (shellReady: boolean) => void;
  editors: ResolvedEditor[];
  editorsLoading: boolean;
  loadEditors: () => Promise<void>;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  shellReady: false,
  setShellReady: (shellReady: boolean) => set({ shellReady }),
  editors: [],
  editorsLoading: false,
  loadEditors: async () => {
    if (get().editorsLoading) return;
    set({ editorsLoading: true });
    try {
      const detected = await invoke<ResolvedEditor[]>("detect_editors");
      set({ editors: detected ?? [] });
    } finally {
      set({ editorsLoading: false });
    }
  },
}));
