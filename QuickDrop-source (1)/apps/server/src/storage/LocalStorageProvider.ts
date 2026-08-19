import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Request, Response } from "express";
import type { StorageProvider } from "./StorageProvider";
import { config } from "../config";

/**
 * Stores files as opaque blobs on the local disk, named by a random key
 * that has no relationship to the user-supplied filename. This is what
 * prevents path traversal: the key is never derived from user input.
 */
export class LocalStorageProvider implements StorageProvider {
  generateKey(): string {
    return crypto.randomBytes(24).toString("hex");
  }

  private resolvePath(key: string): string {
    // Defense in depth: even though keys are our own hex strings, refuse
    // anything that would escape the storage directory.
    const resolved = path.resolve(config.storagePath, key);
    if (!resolved.startsWith(path.resolve(config.storagePath))) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }

  write(key: string, req: Request): Promise<number> {
    return new Promise((resolve, reject) => {
      const dest = this.resolvePath(key);
      let bytesWritten = 0;
      let aborted = false;

      const stream = fs.createWriteStream(dest);

      req.on("data", (chunk: Buffer) => {
        bytesWritten += chunk.length;
        if (bytesWritten > config.maxFileSizeBytes) {
          aborted = true;
          stream.destroy();
          req.destroy();
          fs.unlink(dest, () => {});
          reject(Object.assign(new Error("File exceeds maximum allowed size"), { code: "TOO_LARGE" }));
        }
      });

      req.on("error", (err) => {
        if (!aborted) reject(err);
      });

      stream.on("error", reject);
      stream.on("finish", () => {
        if (!aborted) resolve(bytesWritten);
      });

      req.pipe(stream);
    });
  }

  read(key: string, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = this.resolvePath(key);
      if (!fs.existsSync(filePath)) {
        reject(Object.assign(new Error("Not found"), { code: "NOT_FOUND" }));
        return;
      }
      const stream = fs.createReadStream(filePath);
      stream.on("error", reject);
      stream.on("end", () => resolve());
      stream.pipe(res);
    });
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    await fs.promises.unlink(filePath).catch((err) => {
      if (err.code !== "ENOENT") throw err;
    });
  }
}
