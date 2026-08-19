import { useCallback, useEffect, useState } from "react";
import type { HistoryEntry } from "@quickdrop/shared";

const KEY = "quickdrop:history";

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(load());
  }, []);

  const addEntry = useCallback((entry: HistoryEntry) => {
    setEntries((prev) => {
      const next = [entry, ...prev].slice(0, 500);
      persist(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
    persist([]);
  }, []);

  return { entries, addEntry, clearHistory };
}
