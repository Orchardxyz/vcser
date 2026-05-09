import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  type NativeImage,
} from "electron";
import { getPrismaClient } from "./db";
import { detectEditors } from "./editors/detect";
import { resolveNamespacesToExtensions } from "./editors/configNamespace";
import {
  computeExtensionDiff,
  listInstalledExtensions,
} from "./editors/extensions";
import {
  readSettingsJson,
  diffSettings,
  groupSettingsByNamespace,
} from "./editors/settings";
import type {
  ExtensionSettingsGroup,
  SettingsDiffByExtensionResult,
} from "../renderer/src/types";
import { EXTENSION_SETTINGS_GROUP_KIND } from "../renderer/src/types";

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function resolveAppIconCandidates(): string[] {
  const macIconCandidates =
    process.platform === "darwin"
      ? [
          // mac-specific PNG with correct padding — preferred for dock icon
          // use png file in Mac, because `nativeImage.createFromPath` will return empty image when use .icns file in dev mode.
          join(process.cwd(), "resources", "icon-macos-1024.png"),
          join(app.getAppPath(), "resources", "icon-macos-1024.png"),
          join(process.resourcesPath, "icon-macos-1024.png"),
          join(__dirname, "../../resources/icon-macos-1024.png"),
        ]
      : [];

  return [
    ...macIconCandidates,
    join(process.cwd(), "resources", "icons", "png", "512x512.png"),
    join(app.getAppPath(), "resources", "icons", "png", "512x512.png"),
    join(process.resourcesPath, "icons", "png", "512x512.png"),
    join(__dirname, "../../resources/icons/png/512x512.png"),
  ];
}

function loadAppIcon(): NativeImage | null {
  for (const candidate of resolveAppIconCandidates()) {
    if (!existsSync(candidate)) continue;
    const icon = nativeImage.createFromPath(candidate);
    if (!icon.isEmpty()) return icon;
  }
  return null;
}

function createMainWindow(appIcon: NativeImage | null) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    autoHideMenuBar: true,
    title: "vcser",
    ...(process.platform !== "darwin" && appIcon ? { icon: appIcon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const appIcon = loadAppIcon();

  if (process.platform === "darwin" && appIcon) {
    app.dock.setIcon(appIcon);
  }

  ipcMain.handle("detect_editors", async () => {
    return detectEditors();
  });

  ipcMain.handle("compute_extension_diff", async () => {
    const detected = await detectEditors();
    return await computeExtensionDiff(
      detected.map((e) => ({
        name: e.name,
        extensionsPath: e.extensionsPath,
        stateDbPath: e.stateDbPath,
      })),
    );
  });

  ipcMain.handle(
    "compute_settings_diff_by_extension",
    async (_event, payload: { leftEditor: string; rightEditor: string }) => {
      const prisma = getPrismaClient();
      const detected = await detectEditors();

      const leftEditor = detected.find((e) => e.name === payload.leftEditor);
      const rightEditor = detected.find((e) => e.name === payload.rightEditor);

      if (!leftEditor || !rightEditor) {
        const result: SettingsDiffByExtensionResult = {
          leftName: payload.leftEditor,
          rightName: payload.rightEditor,
          groups: [],
        };
        return result;
      }

      const leftSettings = readSettingsJson(leftEditor.settingsPath);
      const rightSettings = readSettingsJson(rightEditor.settingsPath);

      const diffs = diffSettings(leftSettings, rightSettings);
      const grouped = groupSettingsByNamespace(
        leftSettings,
        rightSettings,
        diffs,
      );

      const leftExtensions = new Set(
        listInstalledExtensions(leftEditor.extensionsPath),
      );
      const rightExtensions = new Set(
        listInstalledExtensions(rightEditor.extensionsPath),
      );
      const allExtensionIds = Array.from(
        new Set([...leftExtensions, ...rightExtensions]),
      );
      const extensionDiff = await computeExtensionDiff([
        {
          name: leftEditor.name,
          extensionsPath: leftEditor.extensionsPath,
          stateDbPath: leftEditor.stateDbPath,
        },
        {
          name: rightEditor.name,
          extensionsPath: rightEditor.extensionsPath,
          stateDbPath: rightEditor.stateDbPath,
        },
      ]);
      const presenceByExtensionId = new Map(
        extensionDiff.all.map((entry) => [entry.extensionId, entry]),
      );

      const extensionsPaths = Array.from(
        new Set([leftEditor.extensionsPath, rightEditor.extensionsPath]),
      );

      const { namespaceToExtension, extensionIcons } =
        await resolveNamespacesToExtensions({
          extensionIds: allExtensionIds,
          extensionsPaths,
          prisma,
        });

      const groups: ExtensionSettingsGroup[] = Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([namespace, stats]) => {
          const extensionId = namespaceToExtension.get(namespace);
          if (!extensionId) {
            return [];
          }

          const extensionIconDataUrl = extensionIcons.get(extensionId);
          const leftHasExtension = leftExtensions.has(extensionId);
          const rightHasExtension = rightExtensions.has(extensionId);

          return [
            {
              kind: EXTENSION_SETTINGS_GROUP_KIND.NAMESPACE,
              namespace,
              extensionId,
              extensionIconDataUrl,
              leftHasExtension,
              rightHasExtension,
              leftVersion:
                presenceByExtensionId.get(extensionId)?.versions[
                  leftEditor.name
                ] ?? null,
              rightVersion:
                presenceByExtensionId.get(extensionId)?.versions[
                  rightEditor.name
                ] ?? null,
              hasVersionMismatch:
                presenceByExtensionId.get(extensionId)?.hasVersionMismatch ??
                false,
              diffs: stats.diffs,
              identicalCount: stats.identicalCount,
              totalCount: stats.totalCount,
            },
          ];
        });

      const namespaceBackedExtensionIds = new Set(
        groups.flatMap((group) =>
          group.extensionId ? [group.extensionId] : [],
        ),
      );
      const versionOnlyGroups: ExtensionSettingsGroup[] = extensionDiff.all
        .filter(
          (entry) =>
            entry.hasVersionMismatch &&
            !namespaceBackedExtensionIds.has(entry.extensionId),
        )
        .sort((a, b) => a.extensionId.localeCompare(b.extensionId))
        .map((entry) => ({
          kind: EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY,
          namespace: "",
          extensionId: entry.extensionId,
          extensionIconDataUrl: entry.iconDataUrl,
          leftHasExtension: entry.presence[leftEditor.name] ?? null,
          rightHasExtension: entry.presence[rightEditor.name] ?? null,
          leftVersion: entry.versions[leftEditor.name] ?? null,
          rightVersion: entry.versions[rightEditor.name] ?? null,
          hasVersionMismatch: true,
          diffs: [],
          identicalCount: 0,
          totalCount: 0,
        }));

      const result: SettingsDiffByExtensionResult = {
        leftName: leftEditor.name,
        rightName: rightEditor.name,
        groups: [...groups, ...versionOnlyGroups],
      };
      return result;
    },
  );

  createMainWindow(appIcon);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(appIcon);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
