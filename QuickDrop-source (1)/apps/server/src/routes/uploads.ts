import { Router } from "express";
import type { CreateDropResponse, ApiErrorResponse } from "@quickdrop/shared";
import { db } from "../db";
import { config } from "../config";
import { generateUniqueCode } from "../utils/codeGen";
import { sanitizeFilename } from "../utils/sanitize";
import { storage } from "../storage";

export const uploadsRouter = Router();

/**
 * Step 1: register the intent to upload. The client sends filename + size
 * up front so we can reject obviously-too-large files before a single byte
 * moves over the wire.
 */
uploadsRouter.post("/uploads", (req, res) => {
  const { filename, sizeBytes } = req.body ?? {};

  if (typeof filename !== "string" || filename.length === 0 || typeof sizeBytes !== "number") {
    const body: ApiErrorResponse = { error: "Invalid request", reason: "invalid_request" };
    return res.status(400).json(body);
  }

  if (sizeBytes > config.maxFileSizeBytes) {
    const body: ApiErrorResponse = { error: "This file is too large for QuickDrop.", reason: "too_large" };
    return res.status(413).json(body);
  }

  const code = generateUniqueCode();
  const storageKey = storage.generateKey();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.expirationMinutes * 60_000);

  db.prepare(
    `INSERT INTO drops (code, original_filename, storage_key, size_bytes, created_at, expires_at, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`
  ).run(code, sanitizeFilename(filename), storageKey, 0, now.toISOString(), expiresAt.toISOString());

  const response: CreateDropResponse = {
    code,
    uploadUrl: `/api/uploads/${code}`,
    expiresAt: expiresAt.toISOString(),
    maxSizeBytes: config.maxFileSizeBytes,
  };
  res.status(201).json(response);
});

/**
 * Step 2: the actual bytes, streamed directly to disk. We never buffer
 * the whole file in memory — LocalStorageProvider pipes the request
 * stream straight to a write stream.
 */
uploadsRouter.put("/uploads/:code", async (req, res) => {
  const row = db.prepare("SELECT * FROM drops WHERE code = ?").get(req.params.code) as
    | { code: string; storage_key: string; status: string }
    | undefined;

  if (!row || row.status !== "active") {
    const body: ApiErrorResponse = { error: "We couldn't find that QuickDrop.", reason: "not_found" };
    return res.status(404).json(body);
  }

  try {
    const bytesWritten = await storage.write(row.storage_key, req);
    db.prepare("UPDATE drops SET size_bytes = ? WHERE code = ?").run(bytesWritten, row.code);
    res.status(200).json({ code: row.code, sizeBytes: bytesWritten });
  } catch (err: any) {
    if (err?.code === "TOO_LARGE") {
      const body: ApiErrorResponse = { error: "This file is too large for QuickDrop.", reason: "too_large" };
      return res.status(413).json(body);
    }
    // eslint-disable-next-line no-console
    console.error("[upload] failed", err);
    const body: ApiErrorResponse = { error: "We couldn't upload your file.", reason: "server_error" };
    res.status(500).json(body);
  }
});
