interface WelcomeProps {
  onGetStarted: () => void;
}

export function Welcome({ onGetStarted }: WelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#3654F4" />
      </svg>
      <div>
        <h1 className="font-display text-2xl font-semibold">Welcome to QuickDrop</h1>
        <p className="mt-2 text-ink-muted dark:text-ink-dark-muted">Send files without the hassle.</p>
      </div>
      <button className="btn-primary" onClick={onGetStarted}>
        Get Started
      </button>
    </div>
  );
}
