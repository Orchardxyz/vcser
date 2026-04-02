import { copyFileSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";

export function createBackup(settingsPath: string): string | null {
  if (!existsSync(settingsPath)) return null;

  const dir = dirname(settingsPath);
  const now = new Date();
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const backupName = `settings.vcser-backup-${ts}.json`;
  const backupPath = join(dir, backupName);

  copyFileSync(settingsPath, backupPath);
  return backupPath;
}
