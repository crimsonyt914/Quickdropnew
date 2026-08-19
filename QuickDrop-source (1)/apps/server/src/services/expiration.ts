import { db, type DropRow } from "../db";
import { config } from "../config";
import { storage } from "../storage";

/**
 * Expiration is enforced here, server-side, on a timer — never trusting
 * the client's clock. Once a drop's time is up its file is deleted from
 * storage and its metadata is marked expired (not removed outright, so
 * "This QuickDrop has expired" can still be shown instead of "not found").
 */
export function startExpirationSweep(): void {
  const sweep = async () => {
    const now = new Date().toISOString();
    const expired = db
      .prepare("SELECT * FROM drops WHERE status = 'active' AND expires_at < ?")
      .all(now) as DropRow[];

    for (const row of expired) {
      try {
        await storage.delete(row.storage_key);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[expiration] failed to delete storage for ${row.code}`, err);
      }
      db.prepare("UPDATE drops SET status = 'expired' WHERE code = ?").run(row.code);
    }

    if (expired.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[expiration] swept ${expired.length} expired drop(s)`);
    }
  };

  sweep();
  setInterval(sweep, config.expirationSweepIntervalMs);
}
