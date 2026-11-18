import logo from '@/assets/logo.svg';
import wordmark from '@/assets/wordmark.svg';
import { cn } from '@/lib/cn';

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2', collapsed && 'justify-center')}>
      <img
        src={logo}
        alt={collapsed ? 'Finexa' : ''}
        aria-hidden={collapsed ? undefined : true}
        className="h-8 w-auto shrink-0"
      />
      {!collapsed ? <img src={wordmark} alt="Finexa" className="h-5 w-auto" /> : null}
    </span>
  );
}
