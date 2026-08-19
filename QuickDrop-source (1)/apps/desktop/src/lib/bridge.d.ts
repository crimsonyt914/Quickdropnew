import type { AppSettings } from "@quickdrop/shared";

export interface QuickDropBridge {
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: AppSettings) => Promise<AppSettings>;
  getApiBaseUrl: () => Promise<string>;
  chooseSaveLocation: (suggestedName: string) => Promise<string | null>;
  chooseDownloadFolder: () => Promise<string | null>;
  notify: (title: string, body: string) => Promise<void>;
  openPath: (filePath: string) => Promise<string>;
  showInFolder: (filePath: string) => Promise<void>;
  writeFile: (filePath: string, data: Uint8Array) => Promise<true>;
  onNavigate: (callback: (route: string) => void) => () => void;
}

declare global {
  interface Window {
    quickdrop: QuickDropBridge;
  }
}
