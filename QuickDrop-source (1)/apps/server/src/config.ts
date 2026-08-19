import path from "node:path";
import "dotenv/config";

/**
 * Central place for all server configuration. Nothing outside this file
 * should read `process.env` directly — that keeps every limit and path
 * easy to find and change.
 */
export const config = {
  port: Number(process.env.QUICKDROP_PORT ?? 4176),

  /** Where uploaded files are written on disk (LocalStorageProvider). */
  storagePath: path.resolve(
    process.env.QUICKDROP_STORAGE_PATH ?? path.join(process.cwd(), "data", "files")
  ),

  /** Where the SQLite metadata database lives. */
  dbPath: path.resolve(
    process.env.QUICKDROP_DB_PATH ?? path.join(process.cwd(), "data", "quickdrop.db")
  ),

  /** Hard ceiling on a single file's size, in bytes. Default: 4 GB. */
  maxFileSizeBytes: Number(process.env.QUICKDROP_MAX_FILE_SIZE ?? 4 * 1024 * 1024 * 1024),

  /** How long a drop stays downloadable before it expires. */
  expirationMinutes: Number(process.env.QUICKDROP_EXPIRATION_MINUTES ?? 30),

  /** How often the expiration sweep runs, in milliseconds. */
  expirationSweepIntervalMs: Number(
    process.env.QUICKDROP_EXPIRATION_SWEEP_MS ?? 60 * 1000
  ),

  /** Comma-separated list of allowed CORS origins. `*` allows the packaged Electron app. */
  corsOrigin: process.env.QUICKDROP_CORS_ORIGIN ?? "*",
};
