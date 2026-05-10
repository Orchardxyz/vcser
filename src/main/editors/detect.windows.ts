import type { EditorRegistryEntry } from "./registry";
import type { DetectedEditor } from "./detect";

export async function detectWindowsEditors(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub, will be implemented with registry lookup
  _entries: EditorRegistryEntry[],
): Promise<DetectedEditor[]> {
  // TODO: implement Windows detection via registry / Program Files lookup
  return [];
}
