import { Router } from "express";
import type { LookupDropResponse, ApiErrorResponse } from "@quickdrop/shared";
import { db, type DropRow } from "../db";
import { storage } from "../storage";

export const downloadsRouter = Router();

function getActiveDrop(code: string): DropRow | undefined {
  const row = db.prepare("SELECT * FROM drops WHERE code = ?").get(code) as DropRow | undefined;
  if (!row) return undefined;

  if (row.status === "active" && new Date(row.expires_at).getTime() < Date.now()) {
    // Lazily expire — the background sweep also does this, but a lookup
    // should never say "found" for something whose clock has already run out.
    db.prepare("UPDATE drops SET status = 'expired' WHERE code = ?").run(code);
    return { ...row, status: "expired" };
  }
  return row;
}

/** Look up a code without downloading — powers the "Receive a file" screen. */
downloadsRouter.get("/drops/:code", (req, res) => {
  const row = getActiveDrop(req.params.code.toUpperCase());

  if (!row || row.status !== "active") {
    const reason = row?.status === "expired" ? "expired" : "not_found";
    const message =
      reason === "expired" ? "This QuickDrop has expired." : "We couldn't find that QuickDrop.";
    const body: ApiErrorResponse = { error: message, reason };
    return res.status(404).json(body);
  }

  const response: LookupDropResponse = {
    code: row.code,
    filename: row.original_filename,
    sizeBytes: row.size_bytes,
    expiresAt: row.expires_at,
  };
  res.json(response);
});

/** Stream the actual file bytes. */
downloadsRouter.get("/drops/:code/download", async (req, res) => {
  const row = getActiveDrop(req.params.code.toUpperCase());

  if (!row || row.status !== "active") {
    const reason = row?.status === "expired" ? "expired" : "not_found";
    const message =
      reason === "expired" ? "This QuickDrop has expired." : "We couldn't find that QuickDrop.";
    const body: ApiErrorResponse = { error: message, reason };
    return res.status(404).json(body);
  }

  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(row.original_filename)}"`);
  res.setHeader("Content-Length", String(row.size_bytes));
  res.setHeader("Content-Type", "application/octet-stream");

  try {
    await storage.read(row.storage_key, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[download] failed", err);
    if (!res.headersSent) {
      const body: ApiErrorResponse = { error: "We couldn't find that QuickDrop.", reason: "not_found" };
      res.status(404).json(body);
    }
  }
});

/** Sender-initiated early delete. */
downloadsRouter.delete("/drops/:code", async (req, res) => {
  const row = db.prepare("SELECT * FROM drops WHERE code = ?").get(req.params.code.toUpperCase()) as
    | DropRow
    | undefined;

  if (!row) {
    const body: ApiErrorResponse = { error: "We couldn't find that QuickDrop.", reason: "not_found" };
    return res.status(404).json(body);
  }

  await storage.delete(row.storage_key);
  db.prepare("UPDATE drops SET status = 'deleted' WHERE code = ?").run(row.code);
  res.status(204).send();
});
