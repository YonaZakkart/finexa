import { X } from 'lucide-react';
import { type MouseEvent, type ReactNode, useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeLabel = 'Cerrar',
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled by the native dialog cancel event.
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      className={cn(
        'm-auto w-[min(90vw,32rem)] border-0 bg-transparent p-0 text-text backdrop:bg-black/70 backdrop:backdrop-blur-sm',
        className
      )}
    >
      <div className="glass-card glass-card--strong max-h-[90dvh] overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </dialog>
  );
}
