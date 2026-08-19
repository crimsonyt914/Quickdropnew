import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function DropZone({ onFilesSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const items = Array.from(event.dataTransfer.items ?? []);
      const hasFolder = items.some((item) => {
        const entry = (item as DataTransferItem & { webkitGetAsEntry?: () => { isDirectory: boolean } | null })
          .webkitGetAsEntry?.();
        return entry?.isDirectory;
      });

      const files = Array.from(event.dataTransfer.files ?? []).filter((f) => f.size > 0 || f.type !== "");
      if (files.length === 0 && !hasFolder) return;
      if (hasFolder && files.length === 0) return; // folders aren't supported; fail quietly, no crash
      onFilesSelected(files);
    },
    [onFilesSelected]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop files here, or press Enter to browse files"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`card flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed py-16 text-center transition-all ${
        isDragging
          ? "scale-[1.01] border-accent bg-accent-soft dark:bg-accent/10"
          : "border-border hover:border-accent/50 dark:border-border-dark"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFilesSelected(files);
          e.target.value = "";
        }}
      />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4v11m0-11 4 4m-4-4-4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
          stroke={isDragging ? "#3654F4" : "#6B7280"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <p className="font-medium">Drop files here</p>
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted">or</p>
      </div>
      <span className="btn-secondary pointer-events-none">Browse files</span>
    </div>
  );
}
