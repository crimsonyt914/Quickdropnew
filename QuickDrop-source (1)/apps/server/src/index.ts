import express from "express";
import cors from "cors";
import { config } from "./config";
import { uploadsRouter } from "./routes/uploads";
import { downloadsRouter } from "./routes/downloads";
import { startExpirationSweep } from "./services/expiration";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", uploadsRouter);
app.use("/api", downloadsRouter);

// Generic fallback — never leak stack traces or internals to a client.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("[server] unhandled error", err);
  res.status(500).json({ error: "QuickDrop is temporarily unavailable. Please try again later.", reason: "server_error" });
});

startExpirationSweep();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`QuickDrop server listening on http://localhost:${config.port}`);
});
