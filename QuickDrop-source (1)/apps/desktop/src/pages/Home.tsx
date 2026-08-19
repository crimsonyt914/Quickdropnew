import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DropZone } from "../components/DropZone";
import { FileRow } from "../components/FileRow";
import { TransferProgress } from "../components/TransferProgress";
import { ShareTicket } from "../components/ShareTicket";
import { QRModal } from "../components/QRModal";
import { uploadFile, deleteDrop, QuickDropApiError } from "../lib/api";
import { formatBytes } from "../lib/format";
import { useTransfers } from "../lib/transfersStore";
import type { HistoryEntry } from "@quickdrop/shared";

type Stage = "select" | "uploading" | "done" | "error";

interface HomeProps {
  onTransferRecorded: (entry: HistoryEntry) => void;
}

export function Home({ onTransferRecorded }: HomeProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [stage, setStage] = useState<Stage>("select");
  const [progress, setProgress] = useState({ loaded: 0, total: 0, bytesPerSec: 0 });
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<{ code: string; link: string; expiresAt: string; filename: string; size: number } | null>(
    null
  );
  const [showQr, setShowQr] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const transferIdRef = useRef<string>("");
  const { upsert, remove } = useTransfers();

  // QuickDrop sends one drop at a time today — multiple files queue up and
  // upload as separate drops, each with its own code. Combining several
  // files into a single drop/archive isn't implemented yet (see README).
  const currentFile = files[0];

  function addFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function startUpload() {
    if (!currentFile) return;
    setStage("uploading");
    setProgress({ loaded: 0, total: currentFile.size, bytesPerSec: 0 });
    abortRef.current = new AbortController();
    transferIdRef.current = crypto.randomUUID();

    try {
      const created = await uploadFile(
        currentFile,
        (loaded, total, bytesPerSec) => {
          setProgress({ loaded, total, bytesPerSec });
          upsert({
            id: transferIdRef.current,
            filename: currentFile.name,
            direction: "upload",
            sizeBytes: total,
            transferredBytes: loaded,
            speedBytesPerSec: bytesPerSec,
            status: "in_progress",
          });
        },
        abortRef.current.signal
      );
      remove(transferIdRef.current);
      const link = `quickdrop.local/${created.code}`;
      setResult({ code: created.code, link, expiresAt: created.expiresAt, filename: currentFile.name, size: currentFile.size });
      setStage("done");
      window.quickdrop.notify("QuickDrop", "Your file is ready to share.");
      onTransferRecorded({
        id: crypto.randomUUID(),
        filename: currentFile.name,
        direction: "upload",
        sizeBytes: currentFile.size,
        date: new Date().toISOString(),
        status: "completed",
        code: created.code,
      });
    } catch (err) {
      remove(transferIdRef.current);
      const message = err instanceof QuickDropApiError ? err.message : "We couldn't upload your file.";
      setErrorMessage(message);
      setStage("error");
      window.quickdrop.notify("QuickDrop", "Your transfer failed.");
      onTransferRecorded({
        id: crypto.randomUUID(),
        filename: currentFile.name,
        direction: "upload",
        sizeBytes: currentFile.size,
        date: new Date().toISOString(),
        status: "cancelled",
      });
    }
  }

  function reset() {
    setFiles((prev) => prev.slice(1));
    setStage("select");
    setResult(null);
    setProgress({ loaded: 0, total: 0, bytesPerSec: 0 });
  }

  async function handleDeleteShared() {
    if (!result) return;
    await deleteDrop(result.code);
    reset();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-8 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">QuickDrop</h1>
          <p className="mt-1 text-ink-muted dark:text-ink-dark-muted">Send files. Simple. Fast.</p>
        </div>
        <Link to="/receive" className="btn-ghost mt-1">
          Receive a file →
        </Link>
      </div>

      {stage === "select" && (
        <>
          <DropZone onFilesSelected={addFiles} />

          {files.length > 0 && (
            <div className="flex flex-col gap-2">
              {files.map((f, i) => (
                <FileRow key={`${f.name}-${i}`} name={f.name} sizeBytes={f.size} onRemove={() => removeFile(i)} />
              ))}
            </div>
          )}

          <button className="btn-primary self-start" disabled={!currentFile} onClick={startUpload}>
            + Create QuickDrop
          </button>
        </>
      )}

      {stage === "uploading" && currentFile && (
        <TransferProgress
          title="Uploading"
          filename={currentFile.name}
          loaded={progress.loaded}
          total={progress.total}
          bytesPerSec={progress.bytesPerSec}
          onCancel={() => {
            abortRef.current?.abort();
            setStage("select");
          }}
        />
      )}

      {stage === "done" && result && (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 animate-check-pop items-center justify-center rounded-full bg-success-soft text-success dark:bg-success/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="font-medium">Your file is ready</p>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
              {result.filename} · {formatBytes(result.size)}
            </p>
          </div>

          <ShareTicket code={result.code} link={result.link} expiresAt={result.expiresAt} onShowQr={() => setShowQr(true)} />

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={handleDeleteShared}>
              Delete file
            </button>
            <button className="btn-primary" onClick={reset}>
              Send another file
            </button>
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-medium text-danger">{errorMessage}</p>
          <button className="btn-primary" onClick={() => setStage("select")}>
            Try again
          </button>
        </div>
      )}

      {showQr && result && <QRModal link={result.link} onClose={() => setShowQr(false)} />}
    </div>
  );
}
