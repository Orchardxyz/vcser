import { describe, expect, it } from "vitest";
import { detectWindowsEditors } from "../../src/editors/detect/detect.windows";
import { SUPPORTED_EDITORS } from "../../src/editors/registry";

function getEntry(slug: string) {
  const entry = SUPPORTED_EDITORS.find((item) => item.slug === slug);
  if (!entry) {
    throw new Error(`Missing editor registry entry for ${slug}`);
  }

  return entry;
}

describe("detectWindowsEditors", () => {
  it("returns editors when their executable paths exist", async () => {
    const vscode = getEntry("vscode");
    const existingPaths = new Set([
      "C:\\Users\\tester\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
      "C:\\Users\\tester\\.vscode\\extensions"
    ]);

    const editors = await detectWindowsEditors([vscode], {
      env: {
        LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
        ProgramFiles: "C:\\Program Files",
        "ProgramFiles(x86)": "C:\\Program Files (x86)"
      },
      homeDir: "C:\\Users\\tester",
      pathExists: (path) => existingPaths.has(path),
      extractAppIcon: async () => ({
        iconPayload: "data:image/png;base64,icon",
        iconStatus: "ready"
      })
    });

    expect(editors).toHaveLength(1);
    expect(editors[0]?.appPath).toBe("C:\\Users\\tester\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe");
    expect(editors[0]?.iconStatus).toBe("ready");
    expect(editors[0]?.iconPayload).toBe("data:image/png;base64,icon");
  });

  it("falls back to user data paths when the executable is missing", async () => {
    const cursor = getEntry("cursor");
    const existingPaths = new Set(["D:\\Users\\tester\\.cursor\\extensions"]);

    const editors = await detectWindowsEditors([cursor], {
      env: {
        LOCALAPPDATA: "D:\\Users\\tester\\AppData\\Local",
        ProgramFiles: "D:\\Program Files",
        "ProgramFiles(x86)": "D:\\Program Files (x86)"
      },
      homeDir: "D:\\Users\\tester",
      pathExists: (path) => existingPaths.has(path)
    });

    expect(editors).toHaveLength(1);
    expect(editors[0]?.appPath).toBe("D:\\Users\\tester\\AppData\\Local\\Programs\\Cursor\\Cursor.exe");
    expect(editors[0]?.extensionsPath).toBe("D:\\Users\\tester\\.cursor\\extensions");
  });

  it("ignores editors without app or user data footprints", async () => {
    const windsurf = getEntry("windsurf");

    const editors = await detectWindowsEditors([windsurf], {
      env: {
        LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
        ProgramFiles: "C:\\Program Files",
        "ProgramFiles(x86)": "C:\\Program Files (x86)"
      },
      homeDir: "C:\\Users\\tester",
      pathExists: () => false
    });

    expect(editors).toEqual([]);
  });

  it("resolves Windows home-based settings and state database paths", async () => {
    const qoder = getEntry("qoder");
    const homeDir = "E:\\Profiles\\tester";
    const existingPaths = new Set([`${homeDir}\\AppData\\Roaming\\Qoder\\User\\settings.json`]);

    const editors = await detectWindowsEditors([qoder], {
      env: {
        LOCALAPPDATA: "E:\\Profiles\\tester\\AppData\\Local",
        ProgramFiles: "E:\\Program Files",
        "ProgramFiles(x86)": "E:\\Program Files (x86)"
      },
      homeDir,
      pathExists: (path) => existingPaths.has(path)
    });

    expect(editors).toHaveLength(1);
    expect(editors[0]?.settingsPath).toBe("E:\\Profiles\\tester\\AppData\\Roaming\\Qoder\\User\\settings.json");
    expect(editors[0]?.stateDbPath).toBe("E:\\Profiles\\tester\\AppData\\Roaming\\Qoder\\User\\globalStorage\\state.vscdb");
  });
});
