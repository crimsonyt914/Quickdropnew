import { Tray, Menu, nativeImage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray: Tray | null = null;

interface TrayCallbacks {
  onOpen: () => void;
  onSendFile: () => void;
  onReceiveFile: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export function createTray(callbacks: TrayCallbacks): Tray {
  const iconPath = path.join(__dirname, "..", "..", "assets", "tray-icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

  const menu = Menu.buildFromTemplate([
    { label: "QuickDrop", enabled: false },
    { type: "separator" },
    { label: "Open QuickDrop", click: callbacks.onOpen },
    { label: "Send File", click: callbacks.onSendFile },
    { label: "Receive File", click: callbacks.onReceiveFile },
    { label: "Settings", click: callbacks.onSettings },
    { type: "separator" },
    { label: "Quit", click: callbacks.onQuit },
  ]);

  tray.setToolTip("QuickDrop — Send files. Simple. Fast.");
  tray.setContextMenu(menu);
  tray.on("click", callbacks.onOpen);

  return tray;
}
