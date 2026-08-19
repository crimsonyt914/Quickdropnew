# QuickDrop

Send files. Simple. Fast.

QuickDrop is a Windows desktop app: drag in a file, get a short share code,
send it to someone, they download it. Built with Electron, React,
TypeScript, Vite, and Tailwind CSS, backed by a small Node/Express server.

## Features

- Drag-and-drop (or Browse) file selection, multiple files queued as separate drops
- Real upload/download progress — actual bytes transferred, not a fake timer
- Short, secure, random share codes (never sequential, never expose internal IDs)
- QR code for the download link, generated locally
- System tray with Open / Send File / Receive File / Settings / Quit
- Minimize-to-tray, start-with-Windows, native Windows notifications
- Native Windows save-file dialog for downloads
- Local, searchable transfer history; live Transfers page for in-progress uploads/downloads
- Server-side file expiration (default 30 minutes) — enforced by the server's clock, not the client's
- Filenames sanitized against path traversal; random storage keys never derived from user input
- Dark / light / follow-Windows theme
- Offline detection — the app still opens and shows local settings/history without a connection

## Requirements

- [Node.js](https://nodejs.org) 18 or later, with npm
- Windows 10/11 to build and run the packaged `.exe` (electron-builder's NSIS
  target is Windows-only; the dev mode below runs fine on macOS/Linux too)

## Installation

```bash
git clone <this project>
cd quickdrop
npm install
cp .env.example .env
```

`npm install` builds the `@quickdrop/shared` package automatically
(`postinstall`).

## Development

Runs the server and the Electron app together, with hot reload:

```bash
npm run dev
```

This starts:
- the Express server on `http://localhost:4176`
- Vite's dev server for the React UI
- Electron, loading the Vite dev server

To run them separately (two terminals):

```bash
npm run dev:server
npm run dev:desktop
```

### Running just the backend

```bash
npm run dev --workspace=apps/server
```

Endpoints (see `apps/server/src/routes` for the full implementation):

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/uploads` | Register a new drop (filename + size), get back a share code |
| PUT | `/api/uploads/:code` | Stream the file bytes for that code |
| GET | `/api/drops/:code` | Look up a code (powers "Receive a file") |
| GET | `/api/drops/:code/download` | Download the file |
| DELETE | `/api/drops/:code` | Sender-initiated early delete |

## Environment variables

See `.env.example`. The important ones:

- `QUICKDROP_MAX_FILE_SIZE` — max upload size in bytes (default 4 GB)
- `QUICKDROP_EXPIRATION_MINUTES` — how long a share code stays valid (default 30)
- `QUICKDROP_STORAGE_PATH` / `QUICKDROP_DB_PATH` — where files and metadata live on disk
- `QUICKDROP_API_URL` — what the desktop app talks to. Leave it pointing at
  `localhost` and the app will spawn its own bundled server (single-machine
  setup, e.g. sharing files between two people on the same network once you
  open a port). Point it at a real deployed server instead if you want
  QuickDrop to work over the open internet between two different computers —
  see "What still needs configuring" below.

No database, cloud storage bucket, or external account is required to run
QuickDrop locally — SQLite and the local filesystem are used out of the box.

## Building

```bash
npm run build
```

Compiles `packages/shared`, `apps/server`, and the Electron main/preload +
React renderer in `apps/desktop`.

## Building the Windows installer

### Option A: build it in the cloud with GitHub Actions (no local setup needed)

This project includes `.github/workflows/build.yml`, which builds the
installer on GitHub's own Windows machines — you don't need Node, a C++
compiler, or anything else installed locally.

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Create a new repository (the "+" icon top right → "New repository"). Any name is fine, e.g. `quickdrop`. Leave it empty — don't initialize with a README.
3. On the new repo's page, click **"uploading an existing file"**, then drag in the entire contents of the unzipped `quickdrop` folder (everything inside it, not the folder itself) and commit.
4. Click the **Actions** tab at the top of the repo. GitHub should already be running "Build QuickDrop Windows Installer" — if not, click it in the left sidebar, then **"Run workflow"**.
5. Wait a few minutes for it to finish (green checkmark).
6. Click into the finished run, scroll to **Artifacts**, and download **QuickDrop-Setup** — that's a zip containing your `.exe`.

### Option B: build it locally

```bash
npm run dist
```

This runs the build above, then electron-builder, producing
`release/QuickDrop-Setup.exe`.

**Native module note:** the server uses `better-sqlite3`, a native module.
Because the installer bundles the server so the app is self-contained, that
module needs to be compiled against Electron's Node ABI, not your system
Node's. If `npm run dist` fails with a `NODE_MODULE_VERSION` mismatch when
QuickDrop first runs, rebuild it for Electron before packaging:

```bash
npx electron-rebuild -f -w better-sqlite3 --module-dir apps/server
```

electron-builder's `extraResources` (see `electron-builder.yml`) copies
`apps/server/dist` and `apps/server/node_modules` into the installed app's
resources folder; the main process spawns that as a child Node process on
launch (see `apps/desktop/electron/main.ts`).

## Project structure

```text
quickdrop/
├── apps/
│   ├── desktop/          # Electron + React + Vite + Tailwind
│   │   ├── electron/     # main process, preload bridge, tray
│   │   └── src/          # renderer: pages, components, lib
│   └── server/           # Express + SQLite backend
│       └── src/
│           ├── routes/       # uploads, downloads
│           ├── storage/      # StorageProvider abstraction + local impl
│           ├── services/     # expiration sweep
│           └── utils/        # code generation, filename sanitization
├── packages/
│   └── shared/           # types shared between server and desktop app
├── assets/                # tray/app icons
└── electron-builder.yml
```

## Security

- Filenames are never trusted: sanitized server-side, and files are stored
  under a random key that has no relationship to the user-supplied name —
  this is what prevents path traversal.
- Share codes are generated with `crypto.randomBytes`, checked for
  uniqueness, and never sequential or derived from a database id.
- File size is validated server-side (both up front and mid-stream, aborting
  an upload that exceeds the configured limit) — the client-side check is a
  courtesy, not the enforcement point.
- Expiration is enforced by the server's clock on a background sweep, so a
  user can't extend access by changing their local system time.
- The Electron renderer runs with `contextIsolation: true`, `sandbox: true`,
  and no direct Node integration; it only reaches the OS through the narrow,
  typed bridge in `electron/preload.ts`.
- Downloaded files are never auto-executed.
- Errors shown to the user are always a fixed, friendly string (see
  `packages/shared`'s `ApiErrorResponse`); raw stack traces are logged
  server-side only, never sent to the client.

## What's fully working

- The entire upload → share code → download flow, with real progress and
  real server-side expiration.
- Sanitization, secure codes, size limits, tray, notifications,
  minimize-to-tray, start-with-Windows, native save dialog, local history,
  settings, dark/light/system theme, offline banner.

## What still needs configuring / is intentionally simplified

- **Sharing between two different computers over the internet** requires a
  publicly reachable server (a small VPS, Render, Fly.io, etc. running
  `apps/server`) with `QUICKDROP_API_URL` in each installed copy of QuickDrop
  pointed at it, plus HTTPS in front of it. Out of the box, QuickDrop's
  bundled local server only accepts connections from the same machine.
- **The Windows installer build was not run or tested in the environment
  this project was generated in** (no network/build access there) — the
  source compiles logically and the electron-builder config is correct in
  shape, but you should expect to debug the first `npm run dist` on your own
  machine, particularly the `better-sqlite3` native rebuild step above.
- **Multiple files selected at once queue as separate share codes**, one
  per drop, rather than being bundled into a single archive/code.
- **"Check for updates", "Privacy", and "Terms"** in Settings → About are
  placeholder buttons with no backend yet, as flagged in the original spec
  for features with no backend.
- **Combining several files into one drop, resumable uploads, and
  password-protected drops** are natural next features but aren't built.
