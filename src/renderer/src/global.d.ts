import type { ResolvedEditor, ExtensionDiffResult, SettingsDiffResult, SyncResult } from "./types";

export {};

declare global {
  interface Window {
    electronAPI?: {
      invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    };
  }
}
