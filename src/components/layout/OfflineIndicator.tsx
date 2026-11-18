import { WifiOff } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/stores/ui.store';

export function OfflineIndicator() {
  const { t } = useTranslation('common');
  const isOnline = useUiStore((state) => state.isOnline);
  const setOnline = useUiStore((state) => state.setOnline);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [setOnline]);

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2 text-sm text-text-muted"
    >
      <WifiOff aria-hidden="true" className="size-4 shrink-0 text-accent" />
      <p>{t('offline')}</p>
    </div>
  );
}
