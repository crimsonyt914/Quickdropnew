/**
 * Filenames come from the user and are never trusted. This strips path
 * separators and traversal sequences and keeps only characters that are
 * safe to show back to another user, while preserving the extension.
 */
export function sanitizeFilename(rawName: string): string {
  const base = rawName
    .replace(/^.*[\\/]/, "") // drop any directory components
    .replace(/\.\./g, "")
    .replace(/[\u0000-\u001f]/g, "") // control characters
    .trim();

  const cleaned = base.replace(/[^a-zA-Z0-9 ._\-()[\]]/g, "_");

  const final = cleaned.length > 0 ? cleaned : "file";
  // Windows path length safety margin.
  return final.length > 200 ? final.slice(0, 200) : final;
}
