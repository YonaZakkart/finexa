import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Modal } from './Modal';

export function DeleteBalanceDialog({
  title,
  description,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: (affectsBalance: boolean) => void;
}) {
  const { t } = useTranslation('common');

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      closeLabel={t('close')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="secondary" onClick={() => onConfirm(false)}>
            {t('deleteKeepBalance')}
          </Button>
          <Button variant="danger" onClick={() => onConfirm(true)}>
            {t('deleteAffectBalance')}
          </Button>
        </>
      }
    />
  );
}
