import type { ActiveTransfer } from "@quickdrop/shared";
import { formatBytes, formatSpeed } from "../lib/format";

interface TransfersProps {
  active: ActiveTransfer[];
}

export function Transfers({ active }: TransfersProps) {
  const uploading = active.filter((t) => t.direction === "upload");
  const downloading = active.filter((t) => t.direction === "download");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-8 py-10">
      <h1 className="font-display text-2xl font-semibold">Transfers</h1>

      <Section title="Uploading" transfers={uploading} />
      <Section title="Downloading" transfers={downloading} />

      {active.length === 0 && (
        <p className="py-12 text-center text-ink-muted dark:text-ink-dark-muted">No active transfers.</p>
      )}
    </div>
  );
}

function Section({ title, transfers }: { title: string; transfers: ActiveTransfer[] }) {
  if (transfers.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-ink-muted dark:text-ink-dark-muted">{title}</h2>
      <div className="flex flex-col gap-2">
        {transfers.map((t) => {
          const percent = t.sizeBytes > 0 ? Math.round((t.transferredBytes / t.sizeBytes) * 100) : 0;
          return (
            <div key={t.id} className="card flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.filename}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border dark:bg-border-dark">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 font-mono text-xs text-ink-muted dark:text-ink-dark-muted">
                  {formatBytes(t.transferredBytes)} / {formatBytes(t.sizeBytes)} · {formatSpeed(t.speedBytesPerSec)}
                </p>
              </div>
              <span className="font-mono text-sm font-medium">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
