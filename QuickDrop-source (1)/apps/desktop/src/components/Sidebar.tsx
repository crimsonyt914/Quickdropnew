import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/transfers", label: "Transfers" },
  { to: "/history", label: "History" },
];

interface SidebarProps {
  connected: boolean;
  version: string;
}

export function Sidebar({ connected, version }: SidebarProps) {
  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-border bg-surface-panel px-3 py-5 dark:border-border-dark dark:bg-surface-dark-panel">
      <div className="mb-8 flex items-center gap-2 px-2">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#3654F4" />
        </svg>
        <span className="font-display text-[15px] font-semibold tracking-tight">QuickDrop</span>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent dark:bg-accent/15"
                  : "text-ink-muted hover:bg-black/[0.03] hover:text-ink dark:text-ink-dark-muted dark:hover:bg-white/[0.05] dark:hover:text-ink-dark"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3 text-xs text-ink-muted dark:border-border-dark dark:text-ink-dark-muted">
        <div className="flex items-center gap-1.5 px-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-success" : "bg-danger"}`}
            aria-hidden="true"
          />
          <span>{connected ? "Connected" : "Offline"}</span>
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `rounded-lg px-2 py-1.5 font-medium transition-colors ${
              isActive ? "text-accent" : "hover:text-ink dark:hover:text-ink-dark"
            }`
          }
        >
          Settings
        </NavLink>
        <span className="px-2 font-mono text-[11px]">v{version}</span>
      </div>
    </aside>
  );
}
