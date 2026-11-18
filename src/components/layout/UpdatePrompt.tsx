import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export function UpdatePrompt({
  visible,
  isUpdating,
  onUpdate,
  onDismiss,
}: {
  visible: boolean;
  isUpdating: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('common');

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2 text-sm"
    >
      <p className="min-w-0">{t('updateAvailable')}</p>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDismiss} disabled={isUpdating}>
          {t('later')}
        </Button>
        <Button size="sm" onClick={onUpdate} isLoading={isUpdating}>
          {t('update')}
        </Button>
      </div>
    </div>
  );
}
