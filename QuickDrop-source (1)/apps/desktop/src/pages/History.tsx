import { useMemo, useState } from "react";
import type { HistoryEntry, TransferStatus } from "@quickdrop/shared";
import { formatBytes } from "../lib/format";

interface HistoryProps {
  entries: HistoryEntry[];
  onClear: () => void;
}

const STATUS_STYLES: Record<TransferStatus, string> = {
  completed: "bg-success-soft text-success dark:bg-success/15",
  failed: "bg-danger-soft text-danger dark:bg-danger/15",
  cancelled: "bg-border text-ink-muted dark:bg-border-dark dark:text-ink-dark-muted",
  expired: "bg-border text-ink-muted dark:bg-border-dark dark:text-ink-dark-muted",
  pending: "bg-accent-soft text-accent dark:bg-accent/15",
  in_progress: "bg-accent-soft text-accent dark:bg-accent/15",
};

const STATUS_LABEL: Record<TransferStatus, string> = {
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
  pending: "Pending",
  in_progress: "In progress",
};

export function History({ entries, onClear }: HistoryProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter((e) => e.filename.toLowerCase().includes(q));
  }, [entries, query]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">History</h1>
        {entries.length > 0 && (
          <button className="btn-ghost" onClick={onClear}>
            Clear history
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search history"
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm dark:border-border-dark"
        />
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-ink-muted dark:text-ink-dark-muted">
          {entries.length === 0 ? "No transfers yet." : "No matching transfers."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry) => (
            <div key={entry.id} className="card flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{entry.filename}</p>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                  {entry.direction === "upload" ? "Sent" : "Received"} · {formatBytes(entry.sizeBytes)} ·{" "}
                  {new Date(entry.date).toLocaleString()}
                </p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[entry.status]}`}>
                {STATUS_LABEL[entry.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
