import type { AppSettings } from "@quickdrop/shared";

interface SettingsProps {
  settings: AppSettings;
  onChange: (partial: Partial<AppSettings>) => void;
  version: string;
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-ink-muted dark:text-ink-dark-muted">{description}</span>}
      </span>
      <span className="relative inline-flex h-5 w-9 flex-shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="absolute inset-0 rounded-full bg-border transition-colors peer-checked:bg-accent dark:bg-border-dark" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-dark-muted">
        {title}
      </h2>
      <div className="card divide-y divide-border px-4 dark:divide-border-dark">{children}</div>
    </section>
  );
}

export function Settings({ settings, onChange, version }: SettingsProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-8 py-10">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>

      <Section title="General">
        <Toggle
          label="Start QuickDrop with Windows"
          checked={settings.startWithWindows}
          onChange={(v) => onChange({ startWithWindows: v })}
        />
        <Toggle
          label="Minimize to system tray"
          description="Closing the window keeps QuickDrop running in the tray"
          checked={settings.minimizeToTray}
          onChange={(v) => onChange({ minimizeToTray: v })}
        />
        <Toggle
          label="Show notifications"
          checked={settings.showNotifications}
          onChange={(v) => onChange({ showNotifications: v })}
        />
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium">Default download folder</p>
            <p className="truncate text-xs text-ink-muted dark:text-ink-dark-muted">
              {settings.defaultDownloadFolder ?? "Ask each time"}
            </p>
          </div>
          <button
            className="btn-secondary flex-shrink-0"
            onClick={async () => {
              const folder = await window.quickdrop.chooseDownloadFolder();
              if (folder) onChange({ defaultDownloadFolder: folder });
            }}
          >
            Choose…
          </button>
        </div>
      </Section>

      <Section title="Appearance">
        <div className="flex items-center justify-between py-3">
          <p className="text-sm font-medium">Theme</p>
          <div className="flex gap-1 rounded-lg border border-border p-0.5 dark:border-border-dark">
            {(["light", "dark", "system"] as const).map((option) => (
              <button
                key={option}
                onClick={() => onChange({ theme: option })}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  settings.theme === option
                    ? "bg-accent text-white"
                    : "text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
                }`}
              >
                {option === "system" ? "Follow Windows" : option}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Transfers">
        <div className="flex items-center justify-between py-3">
          <p className="text-sm font-medium">Maximum simultaneous transfers</p>
          <input
            type="number"
            min={1}
            max={10}
            value={settings.maxSimultaneousTransfers}
            onChange={(e) => onChange({ maxSimultaneousTransfers: Number(e.target.value) })}
            className="w-16 rounded-lg border border-border bg-transparent px-2 py-1 text-center text-sm dark:border-border-dark"
          />
        </div>
        <Toggle
          label="Automatically open downloaded files"
          checked={settings.autoOpenDownloads}
          onChange={(v) => onChange({ autoOpenDownloads: v })}
        />
        <Toggle
          label="Confirm before deleting shared files"
          checked={settings.confirmBeforeDelete}
          onChange={(v) => onChange({ confirmBeforeDelete: v })}
        />
      </Section>

      <Section title="Notifications">
        <Toggle label="Upload complete" checked={settings.notifyUploadComplete} onChange={(v) => onChange({ notifyUploadComplete: v })} />
        <Toggle label="Download complete" checked={settings.notifyDownloadComplete} onChange={(v) => onChange({ notifyDownloadComplete: v })} />
        <Toggle label="Transfer failed" checked={settings.notifyTransferFailed} onChange={(v) => onChange({ notifyTransferFailed: v })} />
        <Toggle label="File expired" checked={settings.notifyFileExpired} onChange={(v) => onChange({ notifyFileExpired: v })} />
      </Section>

      <Section title="About">
        <div className="py-3">
          <p className="font-display text-base font-semibold">QuickDrop</p>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Version {version} · Made for Windows</p>
        </div>
        <div className="flex gap-4 py-3 text-sm">
          <button className="text-accent hover:underline">Check for updates</button>
          <button className="text-accent hover:underline">Privacy</button>
          <button className="text-accent hover:underline">Terms</button>
        </div>
      </Section>
    </div>
  );
}
