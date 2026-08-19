import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Home } from "./pages/Home";
import { Receive } from "./pages/Receive";
import { Transfers } from "./pages/Transfers";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { Welcome } from "./pages/Welcome";
import { useSettings } from "./lib/useSettings";
import { useHistory } from "./lib/useHistory";
import { TransfersContext } from "./lib/transfersStore";
import type { ActiveTransfer } from "@quickdrop/shared";

const APP_VERSION = "1.0.0";
const WELCOME_KEY = "quickdrop:welcomed";

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

function useTheme(theme: "light" | "dark" | "system") {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", isDark);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
}

function useActiveTransfers() {
  const [active, setActive] = useState<ActiveTransfer[]>([]);
  const upsert = (t: ActiveTransfer) =>
    setActive((prev) => {
      const idx = prev.findIndex((p) => p.id === t.id);
      if (idx === -1) return [...prev, t];
      const next = [...prev];
      next[idx] = t;
      return next;
    });
  const remove = (id: string) => setActive((prev) => prev.filter((p) => p.id !== id));
  return { active, upsert, remove };
}

function TrayNavigationListener() {
  const navigate = useNavigate();
  useEffect(() => window.quickdrop.onNavigate(navigate), [navigate]);
  return null;
}

function AppShell() {
  const { settings, updateSettings, loaded } = useSettings();
  const { entries, addEntry, clearHistory } = useHistory();
  const online = useOnlineStatus();
  const transfersStore = useActiveTransfers();
  const [welcomed, setWelcomed] = useState(() => localStorage.getItem(WELCOME_KEY) === "1");

  useTheme(settings.theme);

  if (!loaded) return null; // avoid a settings-flash before the store loads

  if (!welcomed) {
    return (
      <Welcome
        onGetStarted={() => {
          localStorage.setItem(WELCOME_KEY, "1");
          setWelcomed(true);
        }}
      />
    );
  }

  return (
    <TransfersContext.Provider value={transfersStore}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar connected={online} version={APP_VERSION} />
        <main className="flex-1 overflow-y-auto">
          {!online && (
            <div className="bg-danger-soft px-8 py-2 text-center text-sm font-medium text-danger dark:bg-danger/10">
              Offline — uploads and downloads are paused until you're back online.
            </div>
          )}
          <TrayNavigationListener />
          <Routes>
            <Route path="/" element={<Home onTransferRecorded={addEntry} />} />
            <Route path="/receive" element={<Receive onTransferRecorded={addEntry} />} />
            <Route path="/transfers" element={<Transfers active={transfersStore.active} />} />
            <Route path="/history" element={<History entries={entries} onClear={clearHistory} />} />
            <Route
              path="/settings"
              element={<Settings settings={settings} onChange={updateSettings} version={APP_VERSION} />}
            />
          </Routes>
        </main>
      </div>
    </TransfersContext.Provider>
  );
}

export function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
