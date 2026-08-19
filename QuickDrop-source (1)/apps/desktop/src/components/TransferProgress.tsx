import { formatBytes, formatSpeed, formatRemaining } from "../lib/format";

interface TransferProgressProps {
  title: string;
  filename: string;
  loaded: number;
  total: number;
  bytesPerSec: number;
  onCancel: () => void;
}

export function TransferProgress({ title, filename, loaded, total, bytesPerSec, onCancel }: TransferProgressProps) {
  const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

  return (
    <div className="card p-6">
      <p className="mb-1 text-sm font-medium text-ink-muted dark:text-ink-dark-muted">{title}</p>
      <p className="mb-4 truncate font-display text-lg font-semibold">{filename}</p>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} progress`}
        className="h-2 w-full overflow-hidden rounded-full bg-border dark:bg-border-dark"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-mono text-ink-muted dark:text-ink-dark-muted">
          {formatBytes(loaded)} / {formatBytes(total)}
        </span>
        <span className="font-mono font-medium">{percent}%</span>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-ink-muted dark:text-ink-dark-muted">
        <span className="font-mono">{formatSpeed(bytesPerSec)}</span>
        <span>{formatRemaining(total - loaded, bytesPerSec)}</span>
      </div>

      <button onClick={onCancel} className="btn-secondary mt-4 w-full">
        Cancel
      </button>
    </div>
  );
}
