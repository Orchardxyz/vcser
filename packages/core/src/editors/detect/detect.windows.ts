import type { EditorRegistryEntry } from "../registry";
import type { DetectedEditor } from "./detect";

export async function detectWindowsEditors(_entries: readonly EditorRegistryEntry[]): Promise<DetectedEditor[]> {
  // TODO: implement Windows detection via registry / Program Files lookup
  return [];
}
