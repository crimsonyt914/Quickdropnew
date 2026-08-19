import { useState } from "react";
import { formatExpiresIn } from "../lib/format";

interface ShareTicketProps {
  code: string;
  link: string;
  expiresAt: string;
  onShowQr: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn-secondary relative"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

/**
 * The code is presented like a claim ticket — a perforated stub you tear
 * off and hand to someone. It's the one deliberately distinctive element
 * on the Home screen; everything else stays quiet around it.
 */
export function ShareTicket({ code, link, expiresAt, onShowQr }: ShareTicketProps) {
  return (
    <div className="mx-auto flex max-w-sm overflow-hidden rounded-card border border-border shadow-sm dark:border-border-dark">
      <div className="flex-1 bg-surface-panel p-6 dark:bg-surface-dark-panel">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-ink-dark-muted">
          Share code
        </p>
        <p className="mt-1 font-mono text-3xl font-medium tracking-[0.15em] text-ink dark:text-ink-dark">
          {code}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton value={code} label="Copy code" />
          <CopyButton value={link} label="Copy link" />
        </div>
      </div>

      <div className="relative flex w-24 flex-shrink-0 flex-col items-center justify-between border-l border-dashed border-border bg-surface dark:border-border-dark dark:bg-surface-dark py-4">
        <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-surface dark:bg-[#0b0d13]" />
        <span className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-surface dark:bg-[#0b0d13]" />
        <button onClick={onShowQr} className="btn-ghost flex flex-col items-center gap-1 text-[11px]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" fill="currentColor" />
          </svg>
          QR
        </button>
        <p className="text-center font-mono text-[10px] leading-tight text-ink-muted dark:text-ink-dark-muted">
          Expires in
          <br />
          {formatExpiresIn(expiresAt)}
        </p>
      </div>
    </div>
  );
}
