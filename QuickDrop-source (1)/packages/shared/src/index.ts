/**
 * Types shared between the QuickDrop desktop app (renderer + main process)
 * and the QuickDrop server. Keeping this as its own package means the
 * backend can change independently as long as it honors this contract.
 */

export type TransferDirection = "upload" | "download";

export type TransferStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

/** Metadata about a file that has been shared via QuickDrop. */
export interface DropMetadata {
  code: string;
  filename: string;
  sizeBytes: number;
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  status: "active" | "expired" | "deleted";
}

/** Response returned once the server has registered a new drop and is ready to receive bytes. */
export interface CreateDropResponse {
  code: string;
  uploadUrl: string;
  expiresAt: string;
  maxSizeBytes: number;
}

/** Response returned when a code is looked up by a recipient. */
export interface LookupDropResponse {
  code: string;
  filename: string;
  sizeBytes: number;
  expiresAt: string;
}

export interface ApiErrorResponse {
  error: string;
  /** Machine-readable reason, never shown raw to the end user. */
  reason:
    | "not_found"
    | "expired"
    | "too_large"
    | "invalid_request"
    | "server_error";
}

/** A single row in the local (client-side) transfer history. */
export interface HistoryEntry {
  id: string;
  filename: string;
  direction: TransferDirection;
  sizeBytes: number;
  date: string; // ISO timestamp
  status: TransferStatus;
  code?: string;
}

/** A transfer currently in progress, tracked client-side. */
export interface ActiveTransfer {
  id: string;
  filename: string;
  direction: TransferDirection;
  sizeBytes: number;
  transferredBytes: number;
  speedBytesPerSec: number;
  status: TransferStatus;
  code?: string;
}

export interface AppSettings {
  startWithWindows: boolean;
  minimizeToTray: boolean;
  showNotifications: boolean;
  defaultDownloadFolder: string | null;
  theme: "dark" | "light" | "system";
  maxSimultaneousTransfers: number;
  autoOpenDownloads: boolean;
  confirmBeforeDelete: boolean;
  notifyUploadComplete: boolean;
  notifyDownloadComplete: boolean;
  notifyTransferFailed: boolean;
  notifyFileExpired: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  startWithWindows: false,
  minimizeToTray: true,
  showNotifications: true,
  defaultDownloadFolder: null,
  theme: "system",
  maxSimultaneousTransfers: 3,
  autoOpenDownloads: false,
  confirmBeforeDelete: true,
  notifyUploadComplete: true,
  notifyDownloadComplete: true,
  notifyTransferFailed: true,
  notifyFileExpired: false,
};

/** Characters used for share codes. Ambiguous characters (0/O, 1/I/L) are excluded. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
