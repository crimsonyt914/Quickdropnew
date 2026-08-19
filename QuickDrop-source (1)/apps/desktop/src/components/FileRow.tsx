import { formatBytes } from "../lib/format";

interface FileRowProps {
  name: string;
  sizeBytes: number;
  onRemove?: () => void;
}

export function FileRow({ name, sizeBytes, onRemove }: FileRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 dark:border-border-dark">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent dark:bg-accent/15">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{formatBytes(sizeBytes)}</p>
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="btn-ghost !px-2 !py-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}
