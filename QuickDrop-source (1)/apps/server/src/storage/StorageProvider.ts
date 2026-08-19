import type { Request } from "express";
import type { Response } from "express";

/**
 * Abstraction over "where file bytes actually live". LocalStorageProvider
 * is the only implementation today; a future S3/R2-backed provider can
 * implement this same interface without touching any route code.
 */
export interface StorageProvider {
  /** Persist an incoming upload stream under `key`, resolving with the number of bytes written. */
  write(key: string, req: Request): Promise<number>;

  /** Stream a stored file to an HTTP response. */
  read(key: string, res: Response): Promise<void>;

  /** Permanently remove a stored file. Safe to call on a file that no longer exists. */
  delete(key: string): Promise<void>;

  /** Generate a storage key for a new upload. Never derived from the user-supplied filename. */
  generateKey(): string;
}
