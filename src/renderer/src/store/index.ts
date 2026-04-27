import { create } from "zustand";

interface AppStoreState {
  shellReady: boolean;
  setShellReady: (shellReady: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set: (partial: Partial<AppStoreState>) => void) => ({
  shellReady: false,
  setShellReady: (shellReady: boolean) => set({ shellReady }),
}));
