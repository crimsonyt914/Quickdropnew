import type { CreateDropResponse, LookupDropResponse, ApiErrorResponse } from "@quickdrop/shared";

let cachedBaseUrl: string | null = null;

async function baseUrl(): Promise<string> {
  if (!cachedBaseUrl) cachedBaseUrl = await window.quickdrop.getApiBaseUrl();
  return cachedBaseUrl;
}

export class QuickDropApiError extends Error {
  reason: ApiErrorResponse["reason"];
  constructor(message: string, reason: ApiErrorResponse["reason"]) {
    super(message);
    this.reason = reason;
  }
}

async function parseErrorResponse(res: Response): Promise<never> {
  try {
    const body = (await res.json()) as ApiErrorResponse;
    throw new QuickDropApiError(body.error, body.reason);
  } catch (e) {
    if (e instanceof QuickDropApiError) throw e;
    throw new QuickDropApiError("QuickDrop is temporarily unavailable. Please try again later.", "server_error");
  }
}

export interface ProgressCallback {
  (loaded: number, total: number, bytesPerSec: number): void;
}

/** Registers a new drop, then uploads the file bytes with real progress reporting. */
export async function uploadFile(
  file: File,
  onProgress: ProgressCallback,
  signal?: AbortSignal
): Promise<CreateDropResponse> {
  const api = await baseUrl();

  const createRes = await fetch(`${api}/uploads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, sizeBytes: file.size }),
  });
  if (!createRes.ok) await parseErrorResponse(createRes);
  const created = (await createRes.json()) as CreateDropResponse;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `${api}${created.uploadUrl.replace(/^\/api/, "")}`, true);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    let lastLoaded = 0;
    let lastTime = performance.now();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;
      const bytesPerSec = elapsed > 0 ? (event.loaded - lastLoaded) / elapsed : 0;
      lastLoaded = event.loaded;
      lastTime = now;
      onProgress(event.loaded, event.total, bytesPerSec);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new QuickDropApiError("We couldn't upload your file.", "server_error"));
    };
    xhr.onerror = () => reject(new QuickDropApiError("Connection lost. Check your internet connection and try again.", "server_error"));
    xhr.onabort = () => reject(new QuickDropApiError("Upload cancelled", "invalid_request"));

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.send(file);
  });

  return created;
}

export async function lookupCode(code: string): Promise<LookupDropResponse> {
  const api = await baseUrl();
  const res = await fetch(`${api}/drops/${encodeURIComponent(code.trim().toUpperCase())}`);
  if (!res.ok) await parseErrorResponse(res);
  return (await res.json()) as LookupDropResponse;
}

export async function downloadFile(
  code: string,
  filename: string,
  savePath: string,
  onProgress: ProgressCallback,
  signal?: AbortSignal
): Promise<void> {
  const api = await baseUrl();
  const res = await fetch(`${api}/drops/${encodeURIComponent(code)}/download`, { signal });
  if (!res.ok) await parseErrorResponse(res);

  const total = Number(res.headers.get("Content-Length") ?? 0);
  const reader = res.body?.getReader();
  if (!reader) throw new QuickDropApiError("We couldn't find that QuickDrop.", "not_found");

  const chunks: Uint8Array[] = [];
  let loaded = 0;
  let lastLoaded = 0;
  let lastTime = performance.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;
      const bytesPerSec = elapsed > 0 ? (loaded - lastLoaded) / elapsed : 0;
      lastLoaded = loaded;
      lastTime = now;
      onProgress(loaded, total, bytesPerSec);
    }
  }

  const blob = new Blob(chunks as BlobPart[]);
  const buffer = new Uint8Array(await blob.arrayBuffer());

  // The renderer is sandboxed and has no direct filesystem access — the
  // bytes are handed to the main process over IPC, which writes them to
  // the path the user picked in the native save dialog.
  await window.quickdrop.writeFile(savePath, buffer);
  void filename;
}

export async function deleteDrop(code: string): Promise<void> {
  const api = await baseUrl();
  const res = await fetch(`${api}/drops/${encodeURIComponent(code)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) await parseErrorResponse(res);
}
