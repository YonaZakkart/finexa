import { MoreVertical } from 'lucide-react';
import type { ReactNode } from 'react';

export function ActionMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="relative">
      <summary
        aria-label={label}
        className="inline-flex size-11 cursor-pointer list-none items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text [&::-webkit-details-marker]:hidden"
      >
        <MoreVertical aria-hidden="true" className="size-5" />
      </summary>
      <div
        role="menu"
        className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-border bg-bg-elevated p-1 shadow-lg"
      >
        {children}
      </div>
    </details>
  );
}
