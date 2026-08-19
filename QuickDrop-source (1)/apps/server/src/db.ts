import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config";

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
fs.mkdirSync(config.storagePath, { recursive: true });

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");

// Metadata only. The file binary itself lives in the StorageProvider, never in SQLite.
db.exec(`
  CREATE TABLE IF NOT EXISTS drops (
    code TEXT PRIMARY KEY,
    original_filename TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' -- active | expired | deleted
  );

  CREATE INDEX IF NOT EXISTS idx_drops_expires_at ON drops(expires_at);
`);

export interface DropRow {
  code: string;
  original_filename: string;
  storage_key: string;
  size_bytes: number;
  created_at: string;
  expires_at: string;
  status: "active" | "expired" | "deleted";
}
