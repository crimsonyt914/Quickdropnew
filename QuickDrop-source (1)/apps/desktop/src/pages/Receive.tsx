import { useRef, useState } from "react";
import { lookupCode, downloadFile, QuickDropApiError } from "../lib/api";
import { TransferProgress } from "../components/TransferProgress";
import { formatBytes } from "../lib/format";
import { useTransfers } from "../lib/transfersStore";
import type { HistoryEntry, LookupDropResponse } from "@quickdrop/shared";

type Stage = "input" | "found" | "downloading" | "done" | "not_found";

interface ReceiveProps {
  onTransferRecorded: (entry: HistoryEntry) => void;
}

export function Receive({ onTransferRecorded }: ReceiveProps) {
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [drop, setDrop] = useState<LookupDropResponse | null>(null);
  const [progress, setProgress] = useState({ loaded: 0, total: 0, bytesPerSec: 0 });
  const [errorMessage, setErrorMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function findFile() {
    if (!code.trim()) return;
    try {
      const found = await lookupCode(code);
      setDrop(found);
      setStage("found");
    } catch (err) {
      setErrorMessage(err instanceof QuickDropApiError ? err.message : "We couldn't find that QuickDrop.");
      setStage("not_found");
    }
  }

  async function startDownload() {
    if (!drop) return;
    const savePath = await window.quickdrop.chooseSaveLocation(drop.filename);
    if (!savePath) return;

    setStage("downloading");
    setProgress({ loaded: 0, total: drop.sizeBytes, bytesPerSec: 0 });
    abortRef.current = new AbortController();

    try {
      await downloadFile(
        drop.code,
        drop.filename,
        savePath,
        (loaded, total, bytesPerSec) => setProgress({ loaded, total, bytesPerSec }),
        abortRef.current.signal
      );
      setStage("done");
      window.quickdrop.notify("QuickDrop", `${drop.filename} finished downloading.`);
      onTransferRecorded({
        id: crypto.randomUUID(),
        filename: drop.filename,
        direction: "download",
        sizeBytes: drop.sizeBytes,
        date: new Date().toISOString(),
        status: "completed",
        code: drop.code,
      });
    } catch (err) {
      setErrorMessage(err instanceof QuickDropApiError ? err.message : "We couldn't download your file.");
      setStage("not_found");
      window.quickdrop.notify("QuickDrop", "Your transfer failed.");
    }
  }

  function reset() {
    setCode("");
    setDrop(null);
    setStage("input");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-8 py-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">Receive a file</h1>
        <p className="mt-1 text-ink-muted dark:text-ink-dark-muted">Enter the code someone sent you.</p>
      </div>

      {stage === "input" && (
        <div className="card flex flex-col gap-3 p-6">
          <label htmlFor="quickdrop-code" className="text-sm font-medium">
            Enter QuickDrop code
          </label>
          <input
            id="quickdrop-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && findFile()}
            placeholder="K7X2QP"
            maxLength={6}
            className="rounded-lg border border-border bg-transparent px-3 py-2.5 font-mono text-lg tracking-[0.2em] dark:border-border-dark"
            autoFocus
          />
          <button className="btn-primary" disabled={!code.trim()} onClick={findFile}>
            Find File
          </button>
        </div>
      )}

      {stage === "found" && drop && (
        <div className="card flex flex-col gap-4 p-6">
          <p className="text-sm font-medium text-ink-muted dark:text-ink-dark-muted">File found</p>
          <div>
            <p className="font-medium">{drop.filename}</p>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">{formatBytes(drop.sizeBytes)}</p>
          </div>
          <button className="btn-primary" onClick={startDownload}>
            Download
          </button>
        </div>
      )}

      {stage === "downloading" && drop && (
        <TransferProgress
          title="Downloading"
          filename={drop.filename}
          loaded={progress.loaded}
          total={progress.total}
          bytesPerSec={progress.bytesPerSec}
          onCancel={() => {
            abortRef.current?.abort();
            setStage("found");
          }}
        />
      )}

      {stage === "done" && drop && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success dark:bg-success/15">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="font-medium">{drop.filename} downloaded</p>
          <button className="btn-secondary" onClick={reset}>
            Receive another file
          </button>
        </div>
      )}

      {stage === "not_found" && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-medium text-danger">{errorMessage}</p>
          <button className="btn-primary" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
