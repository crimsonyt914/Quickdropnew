import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings } from "@quickdrop/shared";

/**
 * Everything the renderer is allowed to touch on the OS, exposed through
 * a narrow, typed bridge. The renderer never gets direct Node/Electron
 * access (contextIsolation + sandbox are both on in main.ts).
 */
const quickdrop = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke("settings:get"),
  setSettings: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke("settings:set", settings),
  getApiBaseUrl: (): Promise<string> => ipcRenderer.invoke("api:baseUrl"),
  chooseSaveLocation: (suggestedName: string): Promise<string | null> =>
    ipcRenderer.invoke("dialog:chooseSaveLocation", suggestedName),
  chooseDownloadFolder: (): Promise<string | null> => ipcRenderer.invoke("dialog:chooseDownloadFolder"),
  notify: (title: string, body: string): Promise<void> => ipcRenderer.invoke("notify", { title, body }),
  openPath: (filePath: string): Promise<string> => ipcRenderer.invoke("shell:openPath", filePath),
  showInFolder: (filePath: string): Promise<void> => ipcRenderer.invoke("shell:showInFolder", filePath),
  writeFile: (filePath: string, data: Uint8Array): Promise<true> => ipcRenderer.invoke("fs:writeFile", filePath, data),
  onNavigate: (callback: (route: string) => void) => {
    const listener = (_event: unknown, route: string) => callback(route);
    ipcRenderer.on("navigate", listener);
    return () => ipcRenderer.removeListener("navigate", listener);
  },
};

contextBridge.exposeInMainWorld("quickdrop", quickdrop);

export type QuickDropBridge = typeof quickdrop;
