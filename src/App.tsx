import { Plus, Wallet } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';

// Temporary design-system preview; replaced by the real shell in T06/T07.
export function App() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-5 p-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-text-muted uppercase">Finexa</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Control de gastos</h1>
        </div>
        <span className="font-mono text-xs text-text-muted">v{__APP_VERSION__}</span>
      </header>

      <Card className="p-5" aria-labelledby="balance-title">
        <div className="flex items-center justify-between">
          <h2 id="balance-title" className="text-sm font-medium text-text-muted">
            Balance actual
          </h2>
          <Wallet aria-hidden="true" className="size-5 text-accent" />
        </div>
        <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">$1,250.00</p>
        <div className="mt-4 flex gap-6 text-sm">
          <p className="text-text-muted">
            Deuda <span className="ml-1 font-medium text-negative tabular-nums">-$320.00</span>
          </p>
          <p className="text-text-muted">
            Neto <span className="ml-1 font-medium text-positive tabular-nums">$930.00</span>
          </p>
        </div>
      </Card>

      <Card strength="strong" className="p-5" aria-labelledby="expense-title">
        <h2 id="expense-title" className="text-sm font-medium text-text-muted">
          Registrar gasto
        </h2>
        <div className="mt-4">
          <Input
            id="demo-amount"
            label="Monto"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
        <Button className="mt-3">
          <Plus aria-hidden="true" className="size-4" />
          Registrar gasto
        </Button>
      </Card>
    </main>
  );
}
