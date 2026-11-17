import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function EditExpensePlaceholder() {
  const { t } = useTranslation('expenses');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
          aria-label={tCommon('back')}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t('edit')}</h1>
      </header>
      <Card className="p-5 text-center">
        <p className="text-sm text-text-muted">{t('editComingSoon')}</p>
        <Button className="mt-4" onClick={() => navigate('/history')}>
          {t('history')}
        </Button>
      </Card>
    </main>
  );
}
