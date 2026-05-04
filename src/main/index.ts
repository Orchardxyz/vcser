import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { detectEditors } from "./editors/detect";
import { computeExtensionDiff } from "./editors/extensions";

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    autoHideMenuBar: true,
    title: "vcser",
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

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
