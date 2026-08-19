import { app, BrowserWindow, ipcMain, Notification, dialog, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import Store from "electron-store";
import { createTray } from "./tray";
import { DEFAULT_SETTINGS, type AppSettings } from "@quickdrop/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const store = new Store<{ settings: AppSettings }>({
  defaults: { settings: DEFAULT_SETTINGS },
});

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;
let serverProcess: ChildProcess | null = null;

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const API_URL = process.env.QUICKDROP_API_URL ?? "http://localhost:4176/api";

/**
 * In development (and in a simple self-contained packaged build) QuickDrop
 * runs its own local server as a child process. If QUICKDROP_API_URL points
 * somewhere else (a real deployed backend), we skip this — the desktop app
 * is a pure client against that server instead.
 */
function maybeStartLocalServer() {
  const usingLocalDefault = API_URL.includes("localhost");
  if (!usingLocalDefault) return;

  const serverEntry = app.isPackaged
    ? path.join(process.resourcesPath, "server", "index.js")
    : path.join(__dirname, "..", "..", "server", "dist", "index.js");

  serverProcess = spawn(process.execPath, [serverEntry], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    stdio: "inherit",
  });

  serverProcess.on("exit", (code) => {
    console.error(`[quickdrop] local server exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#F7F8FA",
    title: "QuickDrop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (DEV_SERVER_URL) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Closing the window minimizes to tray instead of quitting, if enabled.
  mainWindow.on("close", (event) => {
    const settings = store.get("settings");
    if (!isQuitting && settings.minimizeToTray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Open external links (e.g. "Check for updates") in the OS browser, not the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  maybeStartLocalServer();
  createWindow();

  createTray({
    onOpen: () => mainWindow?.show(),
    onSendFile: () => {
      mainWindow?.show();
      mainWindow?.webContents.send("navigate", "/");
    },
    onReceiveFile: () => {
      mainWindow?.show();
      mainWindow?.webContents.send("navigate", "/receive");
    },
    onSettings: () => {
      mainWindow?.show();
      mainWindow?.webContents.send("navigate", "/settings");
    },
    onQuit: () => {
      isQuitting = true;
      app.quit();
    },
  });

  const settings = store.get("settings");
  app.setLoginItemSettings({ openAtLogin: settings.startWithWindows });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on("window-all-closed", () => {
  // On Windows, the tray keeps the app alive; if minimizeToTray is off,
  // the window's close handler already lets the app quit naturally.
  if (process.platform !== "darwin") {
    const settings = store.get("settings");
    if (!settings.minimizeToTray) app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  serverProcess?.kill();
});

// ---- IPC: renderer <-> main -------------------------------------------------

ipcMain.handle("settings:get", () => store.get("settings"));

ipcMain.handle("settings:set", (_event, next: AppSettings) => {
  store.set("settings", next);
  app.setLoginItemSettings({ openAtLogin: next.startWithWindows });
  return next;
});

ipcMain.handle("api:baseUrl", () => API_URL);

ipcMain.handle("dialog:chooseSaveLocation", async (_event, suggestedName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: suggestedName,
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle("dialog:chooseDownloadFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory", "createDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("notify", (_event, { title, body }: { title: string; body: string }) => {
  const settings = store.get("settings");
  if (!settings.showNotifications) return;
  if (!Notification.isSupported()) return;
  new Notification({ title, body }).show();
});

ipcMain.handle("shell:openPath", (_event, filePath: string) => shell.openPath(filePath));
ipcMain.handle("shell:showInFolder", (_event, filePath: string) => shell.showItemInFolder(filePath));

ipcMain.handle("fs:writeFile", async (_event, filePath: string, data: Uint8Array) => {
  const fs = await import("node:fs/promises");
  await fs.writeFile(filePath, data);
  return true;
});
