export function App() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Finexa</h1>
        <p className="mt-3 font-mono text-xs text-[var(--color-text-muted)]">v{__APP_VERSION__}</p>
      </div>
    </main>
  );
}
