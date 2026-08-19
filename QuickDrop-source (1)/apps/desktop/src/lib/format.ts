export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatRemaining(bytesRemaining: number, bytesPerSec: number): string {
  if (bytesPerSec <= 0) return "Calculating…";
  const seconds = Math.ceil(bytesRemaining / bytesPerSec);
  if (seconds < 60) return `About ${seconds} second${seconds === 1 ? "" : "s"} remaining`;
  const minutes = Math.ceil(seconds / 60);
  return `About ${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
}

export function formatExpiresIn(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}
