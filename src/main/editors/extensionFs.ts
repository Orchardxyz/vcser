import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function findExtensionDir(extensionsPath: string, extensionId: string): Promise<string | undefined> {
  try {
    const prefix = `${extensionId.toLowerCase()}-`;
    const entries = await readdir(extensionsPath, { withFileTypes: true });
    const match = entries.find((entry) => entry.isDirectory() && entry.name.toLowerCase().startsWith(prefix));

    return match ? join(extensionsPath, match.name) : undefined;
  } catch {
    return undefined;
  }
}
