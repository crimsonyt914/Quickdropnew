import { LocalStorageProvider } from "./LocalStorageProvider";
import type { StorageProvider } from "./StorageProvider";

// Swap this line to change the backing store (e.g. an S3StorageProvider)
// without touching any route code.
export const storage: StorageProvider = new LocalStorageProvider();
