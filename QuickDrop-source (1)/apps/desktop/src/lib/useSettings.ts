import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type AppSettings } from "@quickdrop/shared";

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.quickdrop.getSettings().then((s) => {
      setSettingsState(s);
      setLoaded(true);
    });
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      window.quickdrop.setSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings, loaded };
}
