import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRModalProps {
  link: string;
  onClose: () => void;
}

export function QRModal({ link, onClose }: QRModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(link, { margin: 1, width: 220, color: { dark: "#14171F", light: "#00000000" } }).then(
      setDataUrl
    );
  }, [link]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="QR code for download link"
      onClick={onClose}
    >
      <div className="card w-full max-w-xs p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="mb-4 font-display text-base font-semibold">Scan to download</p>
        <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center">
          {dataUrl ? (
            <img src={dataUrl} width={220} height={220} alt="QR code linking to the QuickDrop download" />
          ) : (
            <div className="h-full w-full animate-pulse rounded bg-border dark:bg-border-dark" />
          )}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => navigator.clipboard.writeText(link)}
          >
            Copy Link
          </button>
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
